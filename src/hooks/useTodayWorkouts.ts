import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface TodayWorkout {
  id: string;
  routine_id: string;
  scheduled_date: string | null;
  routine: {
    name: string;
    description: string | null;
  };
  exercise_count: number;
  completed_count: number;
}

export const useTodayWorkouts = () => {
  const { data: workouts = [], isLoading, refetch } = useQuery({
    queryKey: ["today-workouts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];

      // Get routine assignments scheduled for today or recently assigned
      const { data, error } = await supabase
        .from("routine_assignments")
        .select(`
          id,
          routine_id,
          scheduled_date,
          routines!inner (
            name,
            description
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "active")
        .or(`scheduled_date.eq.${today},scheduled_date.is.null`)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      // For each assignment, get exercise count and completion status
      const workoutsWithDetails = await Promise.all(
        (data || []).map(async (assignment) => {
          // Get total exercise count
          const { count: exerciseCount } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", assignment.routine_id);

          // Check if there's an active or completed session for this assignment today
          const { data: sessionData } = await supabase
            .from("workout_sessions")
            .select(`
              id,
              status,
              set_logs (exercise_id)
            `)
            .eq("routine_id", assignment.routine_id)
            .eq("client_id", user.id)
            .gte("started_at", `${today}T00:00:00`)
            .lte("started_at", `${today}T23:59:59`)
            .order("started_at", { ascending: false })
            .limit(1)
            .single();

          // Count unique completed exercises
          let completedCount = 0;
          if (sessionData?.set_logs) {
            const uniqueExercises = new Set(
              sessionData.set_logs.map((log: any) => log.exercise_id)
            );
            completedCount = uniqueExercises.size;
          }

          return {
            id: assignment.id,
            routine_id: assignment.routine_id,
            scheduled_date: assignment.scheduled_date,
            routine: assignment.routines,
            exercise_count: exerciseCount || 0,
            completed_count: completedCount,
          } as TodayWorkout;
        })
      );

      return workoutsWithDetails;
    },
    enabled: true,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("today-workouts-changes")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    workouts,
    isLoading,
  };
};
