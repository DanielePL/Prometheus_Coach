-- Add edited_at column to messages table
ALTER TABLE public.messages
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy to allow users to update their own messages
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Add RLS policy to allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());