-- Allow users to see all participants in conversations they are part of
-- Fixes inbox crash after enabling RLS by permitting SELECT of the "other" participant row

-- Safety: ensure RLS already enabled (no-op if already enabled)
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- New SELECT policy: users can view participant rows for conversations they participate in
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);
