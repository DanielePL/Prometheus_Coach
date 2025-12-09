-- ═══════════════════════════════════════════════════════════════
-- ADD GET_USER_CONVERSATIONS FUNCTION
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
  id UUID,
  updated_at TIMESTAMPTZ,
  other_user_id UUID,
  other_user_full_name TEXT,
  other_user_avatar_url TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  RETURN QUERY
  WITH user_conversations AS (
    SELECT cp.conversation_id, cp.last_read_at
    FROM conversation_participants cp
    WHERE cp.user_id = current_user_id
  ),
  conversation_details AS (
    SELECT 
      c.id, 
      c.updated_at
    FROM conversations c
    JOIN user_conversations uc ON uc.conversation_id = c.id
  ),
  other_participants AS (
    SELECT DISTINCT ON (cp.conversation_id)
      cp.conversation_id,
      p.id as user_id,
      p.full_name,
      p.avatar_url
    FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.user_id != current_user_id
    AND cp.conversation_id IN (SELECT conversation_id FROM user_conversations)
  ),
  last_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content,
      m.created_at,
      m.sender_id
    FROM messages m
    WHERE m.conversation_id IN (SELECT conversation_id FROM user_conversations)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.conversation_id,
      COUNT(*) as count
    FROM messages m
    JOIN user_conversations uc ON uc.conversation_id = m.conversation_id
    WHERE m.sender_id != current_user_id
    AND m.created_at > COALESCE(uc.last_read_at, '1970-01-01'::timestamptz)
    GROUP BY m.conversation_id
  )
  SELECT
    cd.id,
    cd.updated_at,
    op.user_id,
    op.full_name,
    op.avatar_url,
    lm.content,
    lm.created_at,
    lm.sender_id,
    COALESCE(uc.count, 0)
  FROM conversation_details cd
  LEFT JOIN other_participants op ON op.conversation_id = cd.id
  LEFT JOIN last_messages lm ON lm.conversation_id = cd.id
  LEFT JOIN unread_counts uc ON uc.conversation_id = cd.id
  -- Order by last message time, fallback to updated_at
  ORDER BY COALESCE(lm.created_at, cd.updated_at) DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_conversations() TO authenticated;
