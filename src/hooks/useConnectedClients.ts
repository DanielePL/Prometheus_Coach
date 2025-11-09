import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ConnectedClient {
  id: string;
  connection_id: string;
  full_name: string;
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
        .select(`
          id,
          client:profiles!client_id(id, full_name),
          responded_at
        `)
        .eq("coach_id", user.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.client.id,
        connection_id: item.id,
        full_name: item.client.full_name,
        connected_at: item.responded_at,
      })) as ConnectedClient[];
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
