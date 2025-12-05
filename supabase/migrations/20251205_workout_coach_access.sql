-- ═══════════════════════════════════════════════════════════════
-- WORKOUT COACH ACCESS POLICIES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on workout tables if not already enabled
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "coaches_view_client_sessions" ON workout_sessions;
DROP POLICY IF EXISTS "coaches_view_client_set_logs" ON set_logs;

-- Coaches can view their connected clients' workout sessions
CREATE POLICY "coaches_view_client_sessions" ON workout_sessions
  FOR SELECT USING (
    -- Client can see their own sessions
    client_id = auth.uid()
    OR
    -- Coach can see their connected clients' sessions
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = workout_sessions.client_id
      AND status = 'accepted'
    )
  );

-- Coaches can view their connected clients' set logs
CREATE POLICY "coaches_view_client_set_logs" ON set_logs
  FOR SELECT USING (
    -- Client can see their own set logs
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = set_logs.session_id
      AND ws.client_id = auth.uid()
    )
    OR
    -- Coach can see their connected clients' set logs
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN coach_client_connections ccc ON ccc.client_id = ws.client_id
      WHERE ws.id = set_logs.session_id
      AND ccc.coach_id = auth.uid()
      AND ccc.status = 'accepted'
    )
  );

-- Verify policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workout_sessions', 'set_logs')
ORDER BY tablename, policyname;
