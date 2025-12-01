-- Add chat_enabled column to coach_client_connections table
ALTER TABLE public.coach_client_connections
ADD COLUMN chat_enabled BOOLEAN DEFAULT true;

-- Create a security definer function to check if chat is enabled for a client
CREATE OR REPLACE FUNCTION public.is_chat_enabled_for_client(_conversation_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ccc.chat_enabled
      FROM coach_client_connections ccc
      JOIN conversation_participants cp_coach ON cp_coach.user_id = ccc.coach_id
      JOIN conversation_participants cp_client ON cp_client.user_id = ccc.client_id
      WHERE cp_coach.conversation_id = _conversation_id
        AND cp_client.conversation_id = _conversation_id
        AND ccc.client_id = _client_id
        AND ccc.status = 'accepted'
      LIMIT 1
    ),
    true -- Default to true if no connection found
  )
$$;

-- Drop existing INSERT policy on messages if it exists
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

-- Create new INSERT policy that checks chat_enabled for clients
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  (sender_id = auth.uid()) 
  AND is_conversation_participant(conversation_id, auth.uid())
  AND (
    -- Coaches/admins can always send
    has_role(auth.uid(), 'coach'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    -- Clients can only send if chat is enabled
    OR is_chat_enabled_for_client(conversation_id, auth.uid())
  )
);