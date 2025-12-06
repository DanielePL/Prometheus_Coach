-- ═══════════════════════════════════════════════════════════════
-- ADD user_id COLUMN TO workout_sessions
-- Required for Mobile App compatibility
-- ═══════════════════════════════════════════════════════════════

-- 1. Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE workout_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);

    -- Copy existing client_id values to user_id for backwards compatibility
    UPDATE workout_sessions SET user_id = client_id WHERE user_id IS NULL AND client_id IS NOT NULL;

    RAISE NOTICE 'Added user_id column and migrated data from client_id';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

-- 2. Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);

-- 3. Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workout_sessions' AND column_name IN ('user_id', 'client_id')
ORDER BY column_name;
