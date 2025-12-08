-- ═══════════════════════════════════════════════════════════════════════════════
-- FREQUENT MEALS - Quick Add Feature
-- Tracks user's most common meals for 10-second quick logging
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. FREQUENT MEALS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS frequent_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Meal identification
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'shake')),

    -- Stored nutrition data (JSONB for flexibility)
    items JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Aggregated totals (denormalized for quick display)
    total_calories REAL NOT NULL DEFAULT 0,
    total_protein REAL NOT NULL DEFAULT 0,
    total_carbs REAL NOT NULL DEFAULT 0,
    total_fat REAL NOT NULL DEFAULT 0,

    -- Usage tracking
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- User customization
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE, -- true = manually created, false = auto-learned

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one entry per meal name per user
    UNIQUE(user_id, name)
);

-- Index for fast lookup by user + usage (most frequent first)
CREATE INDEX IF NOT EXISTS idx_frequent_meals_user_usage
ON frequent_meals(user_id, usage_count DESC, last_used_at DESC);

-- Index for favorites
CREATE INDEX IF NOT EXISTS idx_frequent_meals_user_favorites
ON frequent_meals(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Index for meal type filtering
CREATE INDEX IF NOT EXISTS idx_frequent_meals_user_type
ON frequent_meals(user_id, meal_type);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. FREQUENT ADD-ONS TABLE (learns common combinations)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS frequent_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Base meal reference
    base_meal_id UUID REFERENCES frequent_meals(id) ON DELETE CASCADE,
    base_meal_name TEXT NOT NULL, -- denormalized for queries

    -- Add-on item data
    addon_name TEXT NOT NULL,
    addon_quantity REAL NOT NULL DEFAULT 1,
    addon_unit TEXT NOT NULL DEFAULT 'piece',
    addon_calories REAL NOT NULL DEFAULT 0,
    addon_protein REAL NOT NULL DEFAULT 0,
    addon_carbs REAL NOT NULL DEFAULT 0,
    addon_fat REAL NOT NULL DEFAULT 0,

    -- Combination tracking
    combination_count INTEGER NOT NULL DEFAULT 1,
    last_combined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one entry per base meal + addon combo per user
    UNIQUE(user_id, base_meal_name, addon_name)
);

-- Index for fetching add-ons for a specific meal
CREATE INDEX IF NOT EXISTS idx_frequent_addons_base_meal
ON frequent_addons(base_meal_id, combination_count DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE frequent_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_addons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own frequent meals" ON frequent_meals;
DROP POLICY IF EXISTS "Users can insert own frequent meals" ON frequent_meals;
DROP POLICY IF EXISTS "Users can update own frequent meals" ON frequent_meals;
DROP POLICY IF EXISTS "Users can delete own frequent meals" ON frequent_meals;
DROP POLICY IF EXISTS "Users can view own frequent addons" ON frequent_addons;
DROP POLICY IF EXISTS "Users can insert own frequent addons" ON frequent_addons;
DROP POLICY IF EXISTS "Users can update own frequent addons" ON frequent_addons;
DROP POLICY IF EXISTS "Users can delete own frequent addons" ON frequent_addons;

-- Users can only see/modify their own frequent meals
CREATE POLICY "Users can view own frequent meals"
ON frequent_meals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own frequent meals"
ON frequent_meals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own frequent meals"
ON frequent_meals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own frequent meals"
ON frequent_meals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Same for addons
CREATE POLICY "Users can view own frequent addons"
ON frequent_addons FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own frequent addons"
ON frequent_addons FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own frequent addons"
ON frequent_addons FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own frequent addons"
ON frequent_addons FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. COACH ACCESS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can view client frequent meals" ON frequent_meals;
DROP POLICY IF EXISTS "Coaches can view client frequent addons" ON frequent_addons;

-- Coaches can view their clients' frequent meals (read-only)
CREATE POLICY "Coaches can view client frequent meals"
ON frequent_meals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coach_client_connections cc
        WHERE cc.coach_id = auth.uid()
        AND cc.client_id = frequent_meals.user_id
        AND cc.status = 'accepted'
    )
);

CREATE POLICY "Coaches can view client frequent addons"
ON frequent_addons FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coach_client_connections cc
        WHERE cc.coach_id = auth.uid()
        AND cc.client_id = frequent_addons.user_id
        AND cc.status = 'accepted'
    )
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────────

-- Function to upsert a frequent meal (increment usage or create new)
CREATE OR REPLACE FUNCTION upsert_frequent_meal(
    p_user_id UUID,
    p_name TEXT,
    p_meal_type TEXT,
    p_items JSONB,
    p_total_calories REAL,
    p_total_protein REAL,
    p_total_carbs REAL,
    p_total_fat REAL
) RETURNS UUID AS $$
DECLARE
    v_meal_id UUID;
BEGIN
    -- Try to update existing
    UPDATE frequent_meals
    SET
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW(),
        -- Update totals in case items changed slightly
        total_calories = p_total_calories,
        total_protein = p_total_protein,
        total_carbs = p_total_carbs,
        total_fat = p_total_fat
    WHERE user_id = p_user_id AND name = p_name
    RETURNING id INTO v_meal_id;

    -- If not found, insert new
    IF v_meal_id IS NULL THEN
        INSERT INTO frequent_meals (
            user_id, name, meal_type, items,
            total_calories, total_protein, total_carbs, total_fat
        ) VALUES (
            p_user_id, p_name, p_meal_type, p_items,
            p_total_calories, p_total_protein, p_total_carbs, p_total_fat
        )
        RETURNING id INTO v_meal_id;
    END IF;

    RETURN v_meal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top frequent meals for a user
CREATE OR REPLACE FUNCTION get_frequent_meals(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_meal_type TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name TEXT,
    meal_type TEXT,
    items JSONB,
    total_calories REAL,
    total_protein REAL,
    total_carbs REAL,
    total_fat REAL,
    usage_count INTEGER,
    last_used_at TIMESTAMPTZ,
    is_favorite BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fm.id,
        fm.name,
        fm.meal_type,
        fm.items,
        fm.total_calories,
        fm.total_protein,
        fm.total_carbs,
        fm.total_fat,
        fm.usage_count,
        fm.last_used_at,
        fm.is_favorite
    FROM frequent_meals fm
    WHERE fm.user_id = p_user_id
    AND (p_meal_type IS NULL OR fm.meal_type = p_meal_type)
    ORDER BY fm.is_favorite DESC, fm.usage_count DESC, fm.last_used_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record an add-on combination
CREATE OR REPLACE FUNCTION record_addon_combination(
    p_user_id UUID,
    p_base_meal_id UUID,
    p_base_meal_name TEXT,
    p_addon_name TEXT,
    p_addon_quantity REAL,
    p_addon_unit TEXT,
    p_addon_calories REAL,
    p_addon_protein REAL,
    p_addon_carbs REAL,
    p_addon_fat REAL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO frequent_addons (
        user_id, base_meal_id, base_meal_name,
        addon_name, addon_quantity, addon_unit,
        addon_calories, addon_protein, addon_carbs, addon_fat
    ) VALUES (
        p_user_id, p_base_meal_id, p_base_meal_name,
        p_addon_name, p_addon_quantity, p_addon_unit,
        p_addon_calories, p_addon_protein, p_addon_carbs, p_addon_fat
    )
    ON CONFLICT (user_id, base_meal_name, addon_name)
    DO UPDATE SET
        combination_count = frequent_addons.combination_count + 1,
        last_combined_at = NOW(),
        addon_quantity = p_addon_quantity,
        addon_calories = p_addon_calories,
        addon_protein = p_addon_protein,
        addon_carbs = p_addon_carbs,
        addon_fat = p_addon_fat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. TRIGGER: Auto-update updated_at
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_frequent_meals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_frequent_meals_updated_at ON frequent_meals;
CREATE TRIGGER trigger_frequent_meals_updated_at
BEFORE UPDATE ON frequent_meals
FOR EACH ROW
EXECUTE FUNCTION update_frequent_meals_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE frequent_meals IS 'Stores frequently used meals for quick-add feature. Auto-learns from user behavior.';
COMMENT ON TABLE frequent_addons IS 'Tracks common add-on combinations (e.g., Shake + Banana).';