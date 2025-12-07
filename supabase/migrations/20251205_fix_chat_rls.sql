-- ═══════════════════════════════════════════════════════════════
-- FIX CHAT RLS POLICIES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Drop all existing policies on chat tables to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop policies on conversations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', pol.policyname);
    END LOOP;

    -- Drop policies on conversation_participants
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversation_participants', pol.policyname);
    END LOOP;

    -- Drop policies on messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- CONVERSATIONS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users can view conversations they participate in
CREATE POLICY "conversations_select" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- Authenticated users can create conversations
CREATE POLICY "conversations_insert" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Participants can update conversations (e.g., updated_at)
CREATE POLICY "conversations_update" ON public.conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════════
-- CONVERSATION_PARTICIPANTS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users can view their own participant records
-- NOTE: Cannot use recursive query on same table - causes infinite recursion
-- If you need to see all participants in a conversation, use a SECURITY DEFINER function
CREATE POLICY "participants_select" ON public.conversation_participants
    FOR SELECT USING (user_id = auth.uid());

-- Users can add participants (themselves or others when creating)
CREATE POLICY "participants_insert" ON public.conversation_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own participant record (e.g., last_read_at)
CREATE POLICY "participants_update" ON public.conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- MESSAGES POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users can view messages in conversations they participate in
CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can send messages to conversations they participate in
CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "messages_update" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "messages_delete" ON public.messages
    FOR DELETE USING (sender_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;
