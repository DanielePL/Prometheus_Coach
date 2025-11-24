import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ProgressUpdate {
  id: string;
  type: 'pr' | 'weight' | 'photo';
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  timestamp: string;
  details: string;
  exerciseName?: string;
}

export const useClientProgressUpdates = () => {
  const { data: updates = [], isLoading, refetch } = useQuery({
    queryKey: ["client-progress-updates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all connected clients
      const { data: connections } = await supabase
        .from("coach_client_connections")
        .select("client_id, client:profiles!client_id(id, full_name, avatar_url)")
        .eq("coach_id", user.id)
        .eq("status", "accepted");

      if (!connections || connections.length === 0) return [];

      const clientIds = connections.map(c => c.client_id);
      const allUpdates: ProgressUpdate[] = [];

      // Fetch recent PRs (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: prs } = await supabase
        .from("personal_records")
        .select(`
          id,
          client_id,
          achieved_at,
          weight_used,
          reps_completed,
          exercise:exercises(title)
        `)
        .in("client_id", clientIds)
        .gte("achieved_at", sevenDaysAgo.toISOString())
        .order("achieved_at", { ascending: false })
        .limit(10);

      if (prs) {
        prs.forEach((pr: any) => {
          const client = connections.find(c => c.client_id === pr.client_id)?.client as any;
          allUpdates.push({
            id: `pr-${pr.id}`,
            type: 'pr',
            clientId: pr.client_id,
            clientName: client?.full_name || 'Unknown',
            clientAvatar: client?.avatar_url || null,
            timestamp: pr.achieved_at,
            details: `${pr.weight_used} kg × ${pr.reps_completed} reps`,
            exerciseName: pr.exercise?.title || 'Unknown Exercise',
          });
        });
      }

      // Fetch recent weight logs (last 7 days)
      const { data: weights } = await supabase
        .from("weight_logs")
        .select("id, client_id, date, weight, created_at")
        .in("client_id", clientIds)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (weights) {
        // Get previous weight for each log to show change
        for (const weightLog of weights) {
          const { data: prevWeight } = await supabase
            .from("weight_logs")
            .select("weight")
            .eq("client_id", weightLog.client_id)
            .lt("date", weightLog.date)
            .order("date", { ascending: false })
            .limit(1)
            .single();

          const client = connections.find(c => c.client_id === weightLog.client_id)?.client as any;
          const change = prevWeight ? weightLog.weight - prevWeight.weight : 0;
          const changeText = change !== 0 
            ? `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)} kg`
            : 'New entry';

          allUpdates.push({
            id: `weight-${weightLog.id}`,
            type: 'weight',
            clientId: weightLog.client_id,
            clientName: client?.full_name || 'Unknown',
            clientAvatar: client?.avatar_url || null,
            timestamp: weightLog.created_at,
            details: `${weightLog.weight} kg (${changeText})`,
          });
        }
      }

      // Fetch recent progress photos (last 7 days)
      const { data: photos } = await supabase
        .from("progress_photos")
        .select("id, client_id, date, type, created_at")
        .in("client_id", clientIds)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (photos) {
        photos.forEach((photo: any) => {
          const client = connections.find(c => c.client_id === photo.client_id)?.client as any;
          allUpdates.push({
            id: `photo-${photo.id}`,
            type: 'photo',
            clientId: photo.client_id,
            clientName: client?.full_name || 'Unknown',
            clientAvatar: client?.avatar_url || null,
            timestamp: photo.created_at,
            details: photo.type ? `${photo.type} photo` : 'Progress photo',
          });
        });
      }

      // Sort all updates by timestamp
      return allUpdates.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10); // Keep only top 10
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("progress-updates-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "personal_records",
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weight_logs",
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "progress_photos",
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { updates, isLoading };
};
