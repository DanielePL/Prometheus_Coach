import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check if chat is enabled for a conversation.
 *
 * Note: The chat_enabled field was removed from coach_client_connections.
 * Chat is now always enabled for accepted connections.
 * This hook is kept for backwards compatibility but always returns true.
 */
export const useChatStatus = (conversationId: string | null) => {
  const { user } = useAuth();

  const { data: chatEnabled = true, isLoading } = useQuery({
    queryKey: ["chat-status", conversationId, user?.id],
    queryFn: async () => {
      // Chat is always enabled for accepted connections
      // The chat_enabled field was removed from the database schema
      return true;
    },
    enabled: !!user && !!conversationId,
  });

  return {
    chatEnabled,
    isLoading,
  };
};