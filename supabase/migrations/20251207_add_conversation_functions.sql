-- ═══════════════════════════════════════════════════════════════
-- CONVERSATION HELPER FUNCTIONS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Function to get all participants in a conversation
-- Uses SECURITY DEFINER to bypass RLS, but checks that caller is a participant
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id UUID)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.user_id,
    cp.role::TEXT,
    cp.joined_at,
    cp.last_read_at
  FROM conversation_participants cp
  WHERE cp.conversation_id = conv_id
  AND EXISTS (
    -- Security check: only return data if calling user is also a participant
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conv_id
    AND cp2.user_id = auth.uid()
  );
$$;

-- Function to get the other participant in a 1:1 conversation
-- Returns the participant that is NOT the calling user
CREATE OR REPLACE FUNCTION get_other_participant(conv_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id as user_id,
    p.full_name,
    p.avatar_url
  FROM conversation_participants cp
  JOIN profiles p ON p.id = cp.user_id
  WHERE cp.conversation_id = conv_id
  AND cp.user_id != auth.uid()
  AND EXISTS (
    -- Security check: only return data if calling user is also a participant
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conv_id
    AND cp2.user_id = auth.uid()
  )
  LIMIT 1;
$$;

-- Function to find a shared conversation between current user and another user
CREATE OR REPLACE FUNCTION find_shared_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp1.conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = auth.uid()
  AND cp2.user_id = target_user_id
  LIMIT 1;
$$;

-- Function to find OR create a conversation with another user
-- Returns the conversation ID (existing or newly created)
CREATE OR REPLACE FUNCTION find_or_create_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_conv_id UUID;
  new_conv_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  -- Check for existing conversation
  SELECT cp1.conversation_id INTO existing_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = current_user_id
  AND cp2.user_id = target_user_id
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;

  -- Create new conversation
  new_conv_id := gen_random_uuid();

  INSERT INTO conversations (id)
  VALUES (new_conv_id);

  -- Add both participants (bypasses RLS via SECURITY DEFINER)
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES
    (new_conv_id, current_user_id, 'member'),
    (new_conv_id, target_user_id, 'member');

  RETURN new_conv_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_other_participant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_shared_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_or_create_conversation(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_conversation_participants', 'get_other_participant');