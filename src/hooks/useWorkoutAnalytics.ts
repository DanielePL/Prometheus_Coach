import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subDays, isAfter, startOfDay } from "date-fns";

export function useWorkoutStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workoutStreak", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      if (!sessions || sessions.length === 0) return 0;

      // Calculate consecutive days with workouts
      let streak = 0;
      let currentDate = startOfDay(new Date());
      
      // Get unique workout dates
      const workoutDates = [...new Set(
        sessions.map(s => startOfDay(new Date(s.completed_at!)).getTime())
      )].sort((a, b) => b - a);

      for (const workoutDate of workoutDates) {
        if (workoutDate === currentDate.getTime() || workoutDate === subDays(currentDate, 1).getTime()) {
          streak++;
          currentDate = new Date(workoutDate);
        } else {
          break;
        }
      }

      return streak;
    },
    enabled: !!user?.id,
  });
}

export function useMonthlyCompletionRate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monthlyCompletionRate", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      // Get assigned routines this month
      const { data: assignments, error: assignmentsError } = await supabase
        .from("routine_assignments")
        .select("id")
        .eq("user_id", user.id)
        .gte("assigned_at", monthStart)
        .lte("assigned_at", monthEnd);

      if (assignmentsError) throw assignmentsError;

      // Get completed workouts this month
      const { data: completedSessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", monthStart)
        .lte("completed_at", monthEnd);

      if (sessionsError) throw sessionsError;

      if (!assignments || assignments.length === 0) return 0;

      const completionRate = (completedSessions?.length || 0) / assignments.length * 100;
      return Math.round(completionRate);
    },
    enabled: !!user?.id,
  });
}

export function useTotalWorkoutTime() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["totalWorkoutTime", user?.id],
    queryFn: async () => {
      if (!user?.id) return { hours: 0, minutes: 0 };

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("duration_seconds", "is", null);

      if (error) throw error;

      const totalSeconds = data?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return { hours, minutes, totalSeconds };
    },
    enabled: !!user?.id,
  });
}

export function useMostPerformedExercises() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mostPerformedExercises", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Mobile App uses workout_sets instead of set_logs
      const { data, error } = await supabase
        .from("workout_sets" as any)
        .select(`
          exercise_id,
          completed_at,
          session:workout_sessions!inner (
            user_id
          )
        `)
        .eq("session.user_id", user.id)
        .not("completed_at", "is", null);

      if (error) throw error;

      // Count exercises
      const exerciseCounts: Record<string, { title: string; count: number; thumbnail?: string }> = {};

      data?.forEach((set: any) => {
        const exerciseId = set.exercise_id;

        if (!exerciseCounts[exerciseId]) {
          exerciseCounts[exerciseId] = { title: exerciseId, count: 0 };
        }
        exerciseCounts[exerciseId].count++;
      });

      // Sort and take top 5
      return Object.values(exerciseCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });
}

export function useVolumeProgression() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["volumeProgression", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Mobile App uses workout_sets instead of set_logs
      const { data: sessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          completed_at,
          workout_sets (
            weight_kg,
            reps,
            completed_at
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      if (sessionsError) throw sessionsError;

      return sessions?.map((session: any) => {
        // Mobile App: reps, weight_kg, completed_at
        const sets = session.workout_sets || [];
        const totalVolume = sets.reduce((sum: number, set: any) => {
          const isCompleted = set.completed_at != null;
          if (isCompleted && set.weight_kg && set.reps) {
            return sum + (set.weight_kg * set.reps);
          }
          return sum;
        }, 0);

        return {
          date: new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volume: Math.round(totalVolume),
        };
      }) || [];
    },
    enabled: !!user?.id,
  });
}
