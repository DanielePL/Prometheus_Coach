import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExerciseStatistics {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name?: string;
  pr_weight_kg: number | null;
  pr_weight_reps: number | null;
  pr_weight_date: string | null;
  pr_reps: number | null;
  pr_reps_weight_kg: number | null;
  pr_reps_date: string | null;
  pr_volume_kg: number | null;
  pr_volume_date: string | null;
  pr_velocity: number | null;
  pr_velocity_date: string | null;
  estimated_1rm_kg: number | null;
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  last_performed_at: string | null;
  first_performed_at: string | null;
}

export interface PRHistory {
  id: string;
  user_id: string;
  exercise_id: string;
  session_id: string;
  pr_type: 'weight' | 'volume' | 'velocity' | 'reps';
  weight_kg: number | null;
  reps: number | null;
  volume_kg: number | null;
  velocity: number | null;
  previous_pr_value: number | null;
  improvement_percentage: number | null;
  achieved_at: string;
}

export interface PRSummary {
  totalPRs: number;
  recentPRs: PRHistory[];
  exerciseStats: ExerciseStatistics[];
  topLifts: {
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
  }[];
}

/**
 * Hook for coaches to view their client's PRs and exercise statistics
 */
export const useClientPRs = (clientId: string) => {
  return useQuery({
    queryKey: ["client-prs", clientId],
    queryFn: async () => {
      // Get exercise statistics (contains current PRs)
      const { data: stats, error: statsError } = await supabase
        .from("exercise_statistics")
        .select("*")
        .eq("user_id", clientId)
        .order("pr_weight_kg", { ascending: false, nullsFirst: false });

      if (statsError) throw statsError;

      // Get recent PR history
      const { data: history, error: historyError } = await supabase
        .from("pr_history")
        .select("*")
        .eq("user_id", clientId)
        .order("achieved_at", { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      // Calculate summary
      const exerciseStats = (stats || []) as ExerciseStatistics[];
      const recentPRs = (history || []) as PRHistory[];

      // Get top lifts (exercises with highest estimated 1RM)
      const topLifts = exerciseStats
        .filter(s => s.estimated_1rm_kg && s.estimated_1rm_kg > 0)
        .sort((a, b) => (b.estimated_1rm_kg || 0) - (a.estimated_1rm_kg || 0))
        .slice(0, 5)
        .map(s => ({
          exerciseId: s.exercise_id,
          exerciseName: s.exercise_name || s.exercise_id,
          weight: s.pr_weight_kg || 0,
          reps: s.pr_weight_reps || 0,
          estimated1RM: s.estimated_1rm_kg || 0
        }));

      const summary: PRSummary = {
        totalPRs: recentPRs.length,
        recentPRs,
        exerciseStats,
        topLifts
      };

      return summary;
    },
    enabled: !!clientId,
  });
};

/**
 * Get PR history for a specific exercise
 */
export const useExercisePRHistory = (clientId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ["exercise-pr-history", clientId, exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pr_history")
        .select("*")
        .eq("user_id", clientId)
        .eq("exercise_id", exerciseId)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data as PRHistory[];
    },
    enabled: !!clientId && !!exerciseId,
  });
};
