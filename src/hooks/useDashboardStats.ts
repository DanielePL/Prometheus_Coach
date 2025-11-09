import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useUserRole } from "./useUserRole";

export const useDashboardStats = () => {
  const { role, isCoach } = useUserRole();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats", role],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { pendingRequests: 0, activeClients: 0 };

      // Fetch pending requests count (role-aware)
      let pendingCount = 0;
      if (isCoach) {
        // For coaches: count pending requests they sent
        const { count } = await supabase
          .from("coach_client_connections")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", user.id)
          .eq("status", "pending");
        pendingCount = count || 0;
      } else {
        // For clients: count pending requests they received
        const { count } = await supabase
          .from("coach_client_connections")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "pending");
        pendingCount = count || 0;
      }

      // Fetch active clients count (only for coaches)
      let activeClientsCount = 0;
      if (isCoach) {
        const { count } = await supabase
          .from("coach_client_connections")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", user.id)
          .eq("status", "accepted");
        activeClientsCount = count || 0;
      }

      return {
        pendingRequests: pendingCount,
        activeClients: activeClientsCount,
      };
    },
    enabled: !!role,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-stats-changes")
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
    pendingRequests: stats?.pendingRequests || 0,
    activeClients: stats?.activeClients || 0,
    isLoading,
  };
};
