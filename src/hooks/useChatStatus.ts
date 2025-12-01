import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useChatStatus = (conversationId: string | null) => {
  const { user } = useAuth();

  const { data: chatEnabled = true, isLoading } = useQuery({
    queryKey: ["chat-status", conversationId, user?.id],
    queryFn: async () => {
      if (!user || !conversationId) return true;

      // Get the other participant in this conversation
      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId);

      if (participantsError || !participants) return true;

      const otherUserId = participants.find(p => p.user_id !== user.id)?.user_id;
      if (!otherUserId) return true;

      // Check if this is a coach-client connection where current user is client
      const { data: connection, error: connectionError } = await supabase
        .from("coach_client_connections")
        .select("chat_enabled")
        .or(`and(coach_id.eq.${otherUserId},client_id.eq.${user.id}),and(coach_id.eq.${user.id},client_id.eq.${otherUserId})`)
        .eq("status", "accepted")
        .maybeSingle();

      if (connectionError || !connection) return true;

      // If current user is the client, check if chat is enabled
      // If current user is the coach, always allow
      const { data: userRole } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Coaches can always send messages
      if (userRole?.role === "coach" || userRole?.role === "admin") {
        return true;
      }

      // For clients, check the chat_enabled status
      return connection.chat_enabled ?? true;
    },
    enabled: !!user && !!conversationId,
  });

  return {
    chatEnabled,
    isLoading,
  };
};
