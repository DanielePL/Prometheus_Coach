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

      // Get completed workout logs this week
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("client_id", user.id)
        .gte("completed_at", startOfWeek.toISOString());

      // Get total assigned workouts
      const { data: assignedWorkouts } = await supabase
        .from("client_workouts")
        .select("*")
        .eq("client_id", user.id);

      // Get sessions this week
      const { data: sessions } = await supabase
        .from("events")
        .select("*")
        .eq("assigned_to", user.id)
        .gte("start_time", startOfWeek.toISOString())
        .lte("start_time", new Date().toISOString());

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

      // Calculate streak (consecutive days with workouts)
      const { data: allLogs } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("client_id", user.id)
        .order("completed_at", { ascending: false });

      let streak = 0;
      if (allLogs && allLogs.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
          const hasWorkout = allLogs.some(log => {
            const logDate = new Date(log.completed_at);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === checkDate.getTime();
          });
          
          if (hasWorkout) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        workoutsCompleted: workoutLogs?.length || 0,
        totalWorkouts: assignedWorkouts?.length || 0,
        totalMinutes: (workoutLogs?.length || 0) * 45, // Estimate 45 min per workout
        sessionsWithCoach: sessions?.length || 0,
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
