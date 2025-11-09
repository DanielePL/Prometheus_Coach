import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

interface Connection {
  id: string;
  coach_id: string;
  client_id: string;
  status: "pending" | "accepted" | "declined";
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  coach?: {
    id: string;
    full_name: string;
    role: string;
  };
  client?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export const useCoachClientConnections = () => {
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["coach-client-connections"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("coach_client_connections")
        .select(`
          *,
          coach:profiles!coach_id(id, full_name, role),
          client:profiles!client_id(id, full_name, role)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as Connection[];
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("coach-client-connections-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coach_client_connections",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["coach-client-connections"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const sendRequest = useMutation({
    mutationFn: async (clientId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("coach_client_connections")
        .insert({
          coach_id: user.id,
          client_id: clientId,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-client-connections"] });
      toast.success("Connection request sent!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("You've already sent a request to this client");
      } else {
        toast.error("Failed to send request");
      }
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("coach_client_connections")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-client-connections"] });
      toast.success("Connection request accepted!");
    },
    onError: () => {
      toast.error("Failed to accept request");
    },
  });

  const declineRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("coach_client_connections")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-client-connections"] });
      toast.success("Connection request declined");
    },
    onError: () => {
      toast.error("Failed to decline request");
    },
  });

  return {
    connections,
    isLoading,
    sendRequest: sendRequest.mutateAsync,
    acceptRequest: acceptRequest.mutateAsync,
    declineRequest: declineRequest.mutateAsync,
  };
};
