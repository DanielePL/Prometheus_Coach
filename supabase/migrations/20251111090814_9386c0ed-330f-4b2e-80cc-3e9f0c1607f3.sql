-- CRITICAL SECURITY FIX: Enable RLS on messaging tables
-- RLS was disabled during development but must be enabled for security

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversation_participants table
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are already defined for these tables
-- This migration only enables RLS enforcement