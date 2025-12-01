import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useToggleClientChat = (clientId: string | undefined) => {
  const queryClient = useQueryClient();

  // Get current chat status for this client
  const { data: chatEnabled = true, isLoading } = useQuery({
    queryKey: ["client-chat-status", clientId],
    queryFn: async () => {
      if (!clientId) return true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;

      const { data, error } = await supabase
        .from("coach_client_connections")
        .select("chat_enabled")
        .eq("coach_id", user.id)
        .eq("client_id", clientId)
        .eq("status", "accepted")
        .maybeSingle();

      if (error || !data) return true;
      return data.chat_enabled ?? true;
    },
    enabled: !!clientId,
  });

  const toggleChat = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!clientId) throw new Error("No client ID");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("coach_client_connections")
        .update({ chat_enabled: enabled })
        .eq("coach_id", user.id)
        .eq("client_id", clientId);

      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ["client-chat-status", clientId] });
      queryClient.invalidateQueries({ queryKey: ["chat-status"] });
      toast.success(`Chat ${enabled ? "enabled" : "disabled"} for this client`);
    },
    onError: () => {
      toast.error("Failed to update chat settings");
    },
  });

  return {
    chatEnabled,
    isLoading,
    toggleChat: toggleChat.mutateAsync,
    isToggling: toggleChat.isPending,
  };
};
