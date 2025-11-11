import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Session {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

export const useClientUpcomingSessions = () => {
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ["client-upcoming-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date().toISOString();

      // Get sessions where user is assigned_to (sessions with coach)
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_time, end_time, event_type")
        .eq("assigned_to", user.id)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(4);

      if (error) throw error;

      return (data || []) as Session[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("client-sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
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
    sessions,
    isLoading,
  };
};
