import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MessageParticipant {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

export const useUnreadMessageParticipants = () => {
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["unread-message-participants"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get conversations where user is a participant
      const { data: userConversations, error: convError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id);

      if (convError || !userConversations) return [];

      const conversationIds = userConversations.map(c => c.conversation_id);

      // Get all participants in these conversations (excluding current user)
      const { data: allParticipants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      if (participantsError || !allParticipants) return [];

      // Filter to only conversations with unread messages
      const participantsWithUnread = await Promise.all(
        allParticipants.map(async (participant) => {
          const userConv = userConversations.find(c => c.conversation_id === participant.conversation_id);
          
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", participant.conversation_id)
            .neq("sender_id", user.id)
            .gt("created_at", userConv?.last_read_at || new Date(0).toISOString());

          if ((count || 0) > 0 && participant.profiles) {
            return {
              id: participant.profiles.id,
              full_name: participant.profiles.full_name,
              avatar_url: participant.profiles.avatar_url,
            } as MessageParticipant;
          }
          return null;
        })
      );

      // Remove nulls and deduplicate by user id
      const uniqueParticipants = participantsWithUnread
        .filter((p): p is MessageParticipant => p !== null)
        .filter((p, index, self) => 
          index === self.findIndex((t) => t.id === p.id)
        );

      return uniqueParticipants;
    },
  });

  return {
    participants,
    isLoading,
  };
};
