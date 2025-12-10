-- Add all body measurement columns to body_measurements table
-- Original columns: chest, waist, hips, arms, legs
-- New columns: neck, shoulders, glutes, forearms, calves

ALTER TABLE body_measurements
ADD COLUMN IF NOT EXISTS neck NUMERIC,
ADD COLUMN IF NOT EXISTS shoulders NUMERIC,
ADD COLUMN IF NOT EXISTS glutes NUMERIC,
ADD COLUMN IF NOT EXISTS forearms NUMERIC,
ADD COLUMN IF NOT EXISTS calves NUMERIC;

-- Full list of measurement columns:
-- 1. neck (NEW)
-- 2. shoulders (NEW)
-- 3. chest (existing)
-- 4. arms (existing)
-- 5. forearms (NEW)
-- 6. waist (existing)
-- 7. hips (existing)
-- 8. glutes (NEW)
-- 9. legs (existing)
-- 10. calves (NEW)
