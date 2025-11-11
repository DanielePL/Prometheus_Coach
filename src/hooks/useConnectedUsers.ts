import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ConnectedUser {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  roles: string[];
}

export const useConnectedUsers = () => {
  const { data: users = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["connected-users"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) return [];

      // Fetch connections based on user role
      const { data: connections, error: connectionsError } = await supabase
        .from("coach_client_connections")
        .select(`
          client:profiles!client_id(id, full_name, avatar_url),
          coach:profiles!coach_id(id, full_name, avatar_url)
        `)
        .eq(profile.role === "coach" ? "coach_id" : "client_id", user.id)
        .eq("status", "accepted");

      if (connectionsError) throw connectionsError;

      // Extract the other user from each connection
      const connectedUsers = (connections || []).map((conn: any) => {
        const otherUser = profile.role === "coach" ? conn.client : conn.coach;
        return {
          id: otherUser.id,
          full_name: otherUser.full_name,
          avatar_url: otherUser.avatar_url,
        };
      });

      // Fetch roles for connected users
      const userIds = connectedUsers.map(u => u.id);
      if (userIds.length === 0) return [];

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Map roles to users
      const usersWithRoles = connectedUsers.map(user => ({
        ...user,
        roles: rolesData
          ?.filter(r => r.user_id === user.id)
          .map(r => r.role) || [],
      }));

      return usersWithRoles as ConnectedUser[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("connected-users-changes")
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
    users,
    isLoading,
    error: queryError?.message || null,
  };
};
