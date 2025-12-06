-- ═══════════════════════════════════════════════════════════════
-- USER PROFILES - COACH ACCESS POLICY
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "coaches_view_client_profiles" ON user_profiles;
DROP POLICY IF EXISTS "coaches_update_client_profiles" ON user_profiles;

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

-- Coaches can update their connected clients' profiles (for PR editing)
CREATE POLICY "coaches_update_client_profiles" ON user_profiles
  FOR UPDATE USING (
    -- User can update own profile
    id = auth.uid()
    OR
    -- Coach can update connected client's profile
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = user_profiles.id
      AND status = 'accepted'
    )
  );

-- Verify
SELECT 'user_profiles coach access policies created' as status;
