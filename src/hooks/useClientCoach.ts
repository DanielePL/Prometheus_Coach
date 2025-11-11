import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface CoachInfo {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  connected_since: string;
}

export const useClientCoach = () => {
  const { data: coach, isLoading, refetch } = useQuery({
    queryKey: ["client-coach"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get accepted connection where current user is the client
      const { data, error } = await supabase
        .from("coach_client_connections")
        .select(`
          responded_at,
          coach:profiles!coach_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "accepted")
        .single();

      if (error || !data) return null;

      return {
        id: data.coach.id,
        full_name: data.coach.full_name,
        avatar_url: data.coach.avatar_url,
        connected_since: data.responded_at,
      } as CoachInfo;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("client-coach-changes")
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
    coach,
    isLoading,
    hasCoach: !!coach,
  };
};
