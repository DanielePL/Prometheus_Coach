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

export const useClientRecentActivity = (clientId?: string) => {
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["client-recent-activity", clientId || "self"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const targetClientId = clientId || user.id;

      const allActivities: Activity[] = [];

      // Get recent workout sessions (using workout_sessions, not workout_logs)
      const { data: workoutSessions } = await supabase
        .from("workout_sessions")
        .select(`
          id, 
          completed_at,
          routine:routines(name)
        `)
        .eq("client_id", targetClientId)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (workoutSessions) {
        workoutSessions.forEach((session: any) => {
          if (session.completed_at) {
            allActivities.push({
              id: session.id,
              type: 'workout',
              title: `Completed ${session.routine?.name || 'Workout'}`,
              timestamp: session.completed_at,
            });
          }
        });
      }

      // Get recent sessions
      const now = new Date().toISOString();
      const { data: sessions } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("assigned_to", targetClientId)
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
        .eq("client_id", targetClientId)
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

      // Get recent routine assignments
      const { data: assignments } = await supabase
        .from("routine_assignments")
        .select(`
          id, 
          assigned_at,
          routine:routines(name)
        `)
        .eq("client_id", targetClientId)
        .order("assigned_at", { ascending: false })
        .limit(5);

      if (assignments) {
        assignments.forEach((assignment: any) => {
          allActivities.push({
            id: assignment.id,
            type: 'assignment',
            title: `Coach assigned: ${assignment.routine?.name || 'Workout'}`,
            timestamp: assignment.assigned_at,
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
          table: "workout_sessions",
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
          table: "routine_assignments",
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
