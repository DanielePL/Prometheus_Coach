import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Activity {
  id: string;
  type: 'workout' | 'session' | 'weight' | 'assignment';
  title: string;
  timestamp: string;
  details?: string;
}

export const useClientRecentActivity = () => {
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["client-recent-activity"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const allActivities: Activity[] = [];

      // Get recent workout logs
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("id, completed_at, workout_id, client_workouts(title)")
        .eq("client_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (workoutLogs) {
        workoutLogs.forEach((log: any) => {
          allActivities.push({
            id: log.id,
            type: 'workout',
            title: `Completed ${log.client_workouts?.title || 'Workout'}`,
            timestamp: log.completed_at,
          });
        });
      }

      // Get recent sessions
      const now = new Date().toISOString();
      const { data: sessions } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("assigned_to", user.id)
        .lte("start_time", now)
        .order("start_time", { ascending: false })
        .limit(5);

      if (sessions) {
        sessions.forEach((session) => {
          allActivities.push({
            id: session.id,
            type: 'session',
            title: session.title,
            timestamp: session.start_time,
          });
        });
      }

      // Get recent weight logs
      const { data: weights } = await supabase
        .from("weight_logs")
        .select("id, weight, date, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (weights) {
        weights.forEach((weight) => {
          allActivities.push({
            id: weight.id,
            type: 'weight',
            title: `Weight logged: ${weight.weight}kg`,
            timestamp: weight.created_at,
          });
        });
      }

      // Get recent workout assignments
      const { data: assignments } = await supabase
        .from("client_workouts")
        .select("id, title, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (assignments) {
        assignments.forEach((assignment) => {
          allActivities.push({
            id: assignment.id,
            type: 'assignment',
            title: `Coach assigned: ${assignment.title}`,
            timestamp: assignment.created_at,
          });
        });
      }

      // Sort all activities by timestamp and take top 10
      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("client-activity-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workout_logs",
        },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weight_logs",
        },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_workouts",
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
    activities,
    isLoading,
  };
};
