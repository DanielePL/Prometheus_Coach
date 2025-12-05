-- ═══════════════════════════════════════════════════════════════
-- FIX MISSING COLUMNS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Add chat_enabled to coach_client_connections
ALTER TABLE coach_client_connections
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true;

-- 2. Add avatar_url to profiles (if missing)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Check workout_sessions table structure and add missing columns
-- (client_id might be named differently)
DO $$
BEGIN
  -- Add client_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'client_id'
  ) THEN
    -- Check if user_id exists and create alias or add column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'workout_sessions' AND column_name = 'user_id'
    ) THEN
      RAISE NOTICE 'workout_sessions uses user_id instead of client_id';
    ELSE
      ALTER TABLE workout_sessions ADD COLUMN client_id UUID REFERENCES auth.users;
    END IF;
  END IF;
END $$;

-- 4. Verify coach_client_connections structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coach_client_connections'
ORDER BY ordinal_position;
