import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyStats {
  workoutsCompleted: number;
  totalWorkouts: number;
  totalMinutes: number;
  sessionsWithCoach: number;
  weightChange: number | null;
  currentStreak: number;
}

export const useClientWeeklyStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["client-weekly-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Get completed workout sessions this week
      const { data: completedSessions } = await supabase
        .from("workout_sessions")
        .select("duration_minutes, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", startOfWeek.toISOString())
        .lte("completed_at", endOfWeek.toISOString());

      // Get routine assignments for this week
      const { data: assignedRoutines } = await supabase
        .from("routine_assignments")
        .select("id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .gte("assigned_at", startOfWeek.toISOString())
        .lte("assigned_at", endOfWeek.toISOString());

      // Calculate total minutes from actual workout durations
      const totalMinutes = Math.round(
        completedSessions?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0
      );

      // Get weight change (compare first and last weight of the week)
      const { data: weights } = await supabase
        .from("weight_logs")
        .select("weight, date")
        .eq("client_id", user.id)
        .gte("date", startOfWeek.toISOString().split('T')[0])
        .order("date", { ascending: true });

      let weightChange = null;
      if (weights && weights.length >= 2) {
        weightChange = Number(weights[weights.length - 1].weight) - Number(weights[0].weight);
      }

      // Calculate streak using workout_sessions
      const { data: allSessions } = await supabase
        .from("workout_sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      let streak = 0;
      if (allSessions && allSessions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        
        // Get unique dates with workouts
        const workoutDates = new Set(
          allSessions.map(session => {
            const date = new Date(session.completed_at!);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          })
        );
        
        // Check consecutive days
        for (let i = 0; i < 30; i++) {
          if (workoutDates.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        workoutsCompleted: completedSessions?.length || 0,
        totalWorkouts: assignedRoutines?.length || 0,
        totalMinutes,
        sessionsWithCoach: 0, // This can be updated if needed
        weightChange,
        currentStreak: streak,
      } as WeeklyStats;
    },
  });

  return {
    stats: stats || {
      workoutsCompleted: 0,
      totalWorkouts: 0,
      totalMinutes: 0,
      sessionsWithCoach: 0,
      weightChange: null,
      currentStreak: 0,
    },
    isLoading,
  };
};
