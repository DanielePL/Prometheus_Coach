import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface PendingParticipant {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

export const usePendingRequestParticipants = () => {
  const { data: participants = [], isLoading, refetch } = useQuery({
    queryKey: ["pending-request-participants"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // For coaches: get clients who they sent pending requests to
      const { data: pendingRequests, error } = await supabase
        .from("coach_client_connections")
        .select(`
          client_id,
          client:profiles!client_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("coach_id", user.id)
        .eq("status", "pending");

      if (error || !pendingRequests) return [];

      return pendingRequests
        .map((request: any): PendingParticipant => ({
          id: request.client.id,
          full_name: request.client.full_name,
          avatar_url: request.client.avatar_url,
        }))
        .filter((p) => p.id && p.full_name);
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("pending-request-participants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coach_client_connections",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    participants,
    isLoading,
  };
};
