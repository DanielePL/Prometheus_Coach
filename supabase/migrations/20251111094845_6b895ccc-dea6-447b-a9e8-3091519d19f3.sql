-- Drop existing INSERT policy on conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a permissive INSERT policy for conversations
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the policy is working
COMMENT ON POLICY "Users can create conversations" ON conversations IS 'Allows any authenticated user to create a conversation. Security is enforced via conversation_participants table.';