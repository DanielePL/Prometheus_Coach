import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientProgress {
  workoutCompletionRate: number;
  weightTrend: { direction: "up" | "down" | "stable"; change: number } | null;
  lastWorkoutDate: string | null;
  currentStreak: number;
}

export const useClientProgress = (clientId: string) => {
  return useQuery({
    queryKey: ["client-progress", clientId],
    queryFn: async (): Promise<ClientProgress> => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get workout completion rate for this month
      const { data: assignedWorkouts } = await supabase
        .from("client_workouts")
        .select("id, status")
        .eq("client_id", clientId)
        .gte("created_at", firstDayOfMonth.toISOString());

      const totalWorkouts = assignedWorkouts?.length || 0;
      const completedWorkouts = assignedWorkouts?.filter((w) => w.status === "completed").length || 0;
      const workoutCompletionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

      // Get weight trend (last 2 entries)
      const { data: weightLogs } = await supabase
        .from("weight_logs")
        .select("weight, date")
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(2);

      let weightTrend = null;
      if (weightLogs && weightLogs.length >= 2) {
        const change = Number(weightLogs[0].weight) - Number(weightLogs[1].weight);
        weightTrend = {
          direction: change > 0.5 ? "up" : change < -0.5 ? "down" : "stable",
          change: Math.abs(change),
        };
      }

      // Get last workout date
      const { data: lastWorkout } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("client_id", clientId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculate current streak
      const { data: recentWorkouts } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("client_id", clientId)
        .order("completed_at", { ascending: false })
        .limit(30);

      let currentStreak = 0;
      if (recentWorkouts && recentWorkouts.length > 0) {
        const dates = recentWorkouts.map((w) => new Date(w.completed_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        let checkDate = new Date();
        for (const dateStr of uniqueDates) {
          const workoutDate = new Date(dateStr);
          const diffDays = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 1 && diffDays >= 0) {
            currentStreak++;
            checkDate = workoutDate;
          } else {
            break;
          }
        }
      }

      return {
        workoutCompletionRate,
        weightTrend,
        lastWorkoutDate: lastWorkout?.completed_at || null,
        currentStreak,
      };
    },
    enabled: !!clientId,
  });
};
