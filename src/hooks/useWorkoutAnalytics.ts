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
        .eq("client_id", user.id)
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
        .eq("client_id", user.id)
        .gte("assigned_at", monthStart)
        .lte("assigned_at", monthEnd);

      if (assignmentsError) throw assignmentsError;

      // Get completed workouts this month
      const { data: completedSessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("client_id", user.id)
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
        .eq("client_id", user.id)
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

      const { data, error } = await supabase
        .from("set_logs")
        .select(`
          exercise_id,
          exercises (
            title,
            thumbnail_url
          ),
          session:workout_sessions!inner (
            client_id
          )
        `)
        .eq("session.client_id", user.id)
        .eq("completed", true);

      if (error) throw error;

      // Count exercises
      const exerciseCounts: Record<string, { title: string; count: number; thumbnail?: string }> = {};
      
      data?.forEach((log: any) => {
        const exerciseId = log.exercise_id;
        const title = log.exercises?.title || "Unknown Exercise";
        const thumbnail = log.exercises?.thumbnail_url;
        
        if (!exerciseCounts[exerciseId]) {
          exerciseCounts[exerciseId] = { title, count: 0, thumbnail };
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

      const { data: sessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          completed_at,
          set_logs (
            weight_used,
            reps_completed,
            completed
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      if (sessionsError) throw sessionsError;

      return sessions?.map((session: any) => {
        const totalVolume = session.set_logs?.reduce((sum: number, log: any) => {
          if (log.completed && log.weight_used && log.reps_completed) {
            return sum + (log.weight_used * log.reps_completed);
          }
          return sum;
        }, 0) || 0;

        return {
          date: new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volume: Math.round(totalVolume),
        };
      }) || [];
    },
    enabled: !!user?.id,
  });
}
