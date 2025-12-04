import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ConnectedClient {
  id: string;
  connection_id: string;
  full_name: string;
  avatar_url?: string | null;
  connected_at: string;
}

export const useConnectedClients = () => {
  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ["connected-clients"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("coach_client_connections")
        .select("id, client_id, responded_at")
        .eq("coach_id", user.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles separately
      const clientIds = data.map(d => d.client_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map((item: any) => {
        const profile = profileMap.get(item.client_id);
        return {
          id: item.client_id,
          connection_id: item.id,
          full_name: profile?.full_name || "Unknown",
          avatar_url: profile?.avatar_url,
          connected_at: item.responded_at,
        };
      }) as ConnectedClient[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("connected-clients-changes")
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
    clients,
    isLoading,
  };
};
