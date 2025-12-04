-- ═══════════════════════════════════════════════════════════════
-- CREATE TEST CLIENT FOR COACH
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- First, let's see what users exist:
SELECT id, email, raw_user_meta_data->>'full_name' as name,
       (SELECT role FROM profiles WHERE profiles.id = auth.users.id) as role
FROM auth.users;

-- ═══════════════════════════════════════════════════════════════
-- OPTION 1: If you have another user, connect them as client
-- Replace 'CLIENT_EMAIL_HERE' with an actual email from the list above
-- ═══════════════════════════════════════════════════════════════

/*
DO $$
DECLARE
  v_coach_id UUID;
  v_client_id UUID;
BEGIN
  -- Get coach ID
  SELECT id INTO v_coach_id FROM auth.users WHERE email = 'danielepauli@gmail.com';

  -- Get client ID (change this email!)
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'CLIENT_EMAIL_HERE';

  -- Update client profile to role 'client'
  UPDATE profiles SET role = 'client' WHERE id = v_client_id;

  -- Create connection
  INSERT INTO coach_client_connections (coach_id, client_id, status, chat_enabled)
  VALUES (v_coach_id, v_client_id, 'accepted', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Connected! Coach: %, Client: %', v_coach_id, v_client_id;
END $$;
*/

-- ═══════════════════════════════════════════════════════════════
-- OPTION 2: Create a real test user via Supabase Auth
-- Go to: Supabase Dashboard → Authentication → Users → Add User
-- Email: testclient@test.com, Password: test123456
-- Then run this:
-- ═══════════════════════════════════════════════════════════════

/*
DO $$
DECLARE
  v_coach_id UUID;
  v_client_id UUID;
BEGIN
  SELECT id INTO v_coach_id FROM auth.users WHERE email = 'danielepauli@gmail.com';
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'testclient@test.com';

  -- Ensure profile exists with client role
  INSERT INTO profiles (id, full_name, role)
  VALUES (v_client_id, 'Test Client', 'client')
  ON CONFLICT (id) DO UPDATE SET role = 'client';

  -- Create connection
  INSERT INTO coach_client_connections (coach_id, client_id, status, chat_enabled)
  VALUES (v_coach_id, v_client_id, 'accepted', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done!';
END $$;
*/
