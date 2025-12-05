-- ═══════════════════════════════════════════════════════════════
-- VBT (Velocity Based Training) TABLES AND POLICIES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Create workout_sets table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg DECIMAL(10,2),
  duration_seconds INTEGER,
  rpe INTEGER,
  rest_seconds INTEGER,
  velocity_metrics JSONB,
  video_url TEXT,
  video_storage_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_id ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);

-- Add user_id column to workout_sessions if it doesn't exist (Mobile App uses user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE workout_sessions ADD COLUMN user_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'workout_name'
  ) THEN
    ALTER TABLE workout_sessions ADD COLUMN workout_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE workout_sessions ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_manage_own_sets" ON workout_sets;
DROP POLICY IF EXISTS "coaches_view_client_sets" ON workout_sets;

-- Clients can manage their own sets (check both client_id and user_id)
CREATE POLICY "clients_manage_own_sets" ON workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_sets.session_id
      AND (ws.client_id = auth.uid() OR ws.user_id = auth.uid())
    )
  );

-- Coaches can view their connected clients' sets (check both client_id and user_id)
CREATE POLICY "coaches_view_client_sets" ON workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN coach_client_connections ccc ON (ccc.client_id = ws.client_id OR ccc.client_id = ws.user_id)
      WHERE ws.id = workout_sets.session_id
      AND ccc.coach_id = auth.uid()
      AND ccc.status = 'accepted'
    )
  );

-- Update workout_sessions RLS to also check user_id
DROP POLICY IF EXISTS "coaches_view_client_sessions" ON workout_sessions;
CREATE POLICY "coaches_view_client_sessions" ON workout_sessions
  FOR SELECT USING (
    client_id = auth.uid()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND (client_id = workout_sessions.client_id OR client_id = workout_sessions.user_id)
      AND status = 'accepted'
    )
  );

-- Verify
SELECT 'VBT tables and policies created/updated' as status;
