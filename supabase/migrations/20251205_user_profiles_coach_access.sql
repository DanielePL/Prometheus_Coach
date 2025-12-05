-- ═══════════════════════════════════════════════════════════════
-- USER PROFILES - COACH ACCESS POLICY
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Drop existing coach policy if exists
DROP POLICY IF EXISTS "coaches_view_client_profiles" ON user_profiles;

-- Coaches can view their connected clients' profiles (including PRs)
CREATE POLICY "coaches_view_client_profiles" ON user_profiles
  FOR SELECT USING (
    -- User can view own profile
    id = auth.uid()
    OR
    -- Coach can view connected client's profile
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = user_profiles.id
      AND status = 'accepted'
    )
  );

-- Verify
SELECT 'user_profiles coach access policy created' as status;
