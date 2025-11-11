-- 1) Helper function to safely check participation without recursive policy evaluation
create or replace function public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = _conversation_id
      and user_id = _user_id
  );
$$;

-- 2) Replace problematic SELECT policy to avoid circular reference
DROP POLICY IF EXISTS "Users can view participants in their conversations"
ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(conversation_participants.conversation_id, auth.uid())
);