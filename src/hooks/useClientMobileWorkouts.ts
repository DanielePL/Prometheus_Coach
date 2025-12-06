import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Training Summary from Mobile App (user_training_summary table)
 */
export interface ClientTrainingSummary {
  user_id: string;

  // Lifetime Stats
  total_workouts: number;
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  total_training_minutes: number;
  total_prs: number;

  // Streaks
  current_streak_days: number;
  longest_streak_days: number;
  last_workout_date: string | null;

  // This Week
  week_workouts: number;
  week_volume_kg: number;

  // This Month
  month_workouts: number;
  month_volume_kg: number;

  // This Year
  year_workouts: number;
  year_volume_kg: number;
  year_prs: number;

  // Averages
  avg_workout_duration_minutes: number | null;
  avg_workouts_per_week: number | null;
  avg_volume_per_workout: number | null;

  // Favorites
  favorite_exercises: string[] | null;

  // Timestamps
  first_workout_at: string | null;
  updated_at: string;
}

/**
 * Workout History entry from Mobile App (workout_history table)
 */
export interface ClientWorkoutHistoryEntry {
  id: string;
  session_id: string;
  user_id: string;

  // Program Context
  program_id: string | null;
  program_week: number | null;
  program_day: number | null;

  // Workout Info
  workout_template_id: string | null;
  workout_name: string;

  // Summary Stats
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  total_exercises: number;
  duration_minutes: number | null;

  // Performance
  avg_rpe: number | null;
  fatigue_index: number | null;
  performance_score: number | null;

  // Records
  prs_achieved: number;
  pr_exercises: string[] | null;

  // VBT
  avg_velocity: number | null;
  total_reps_tracked: number;

  // User Input
  notes: string | null;
  mood_rating: number | null;
  energy_rating: number | null;

  // Timestamps
  started_at: string | null;
  completed_at: string;
  completed_date: string;
  day_of_week: number;
}

/**
 * Hook to fetch training summary from Mobile App's user_training_summary table
 */
export const useClientTrainingSummary = (clientId: string) => {
  return useQuery({
    queryKey: ["client-training-summary", clientId],
    queryFn: async () => {
      console.log("Fetching Training Summary for clientId:", clientId);

      const { data, error } = await supabase
        .from("user_training_summary" as any)
        .select("*")
        .eq("user_id", clientId)
        .single();

      if (error) {
        // Table might not exist yet - return null gracefully
        if (error.code === "PGRST116" || error.code === "42P01") {
          console.log("user_training_summary not found for client");
          return null;
        }
        console.error("Error fetching training summary:", error);
        throw error;
      }

      console.log("Training summary:", data);
      return data as ClientTrainingSummary;
    },
    enabled: !!clientId,
  });
};

/**
 * Hook to fetch workout history from Mobile App's workout_history table
 */
export const useClientWorkoutHistory = (clientId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ["client-workout-history", clientId, limit],
    queryFn: async () => {
      console.log("Fetching Workout History for clientId:", clientId);

      const { data, error } = await supabase
        .from("workout_history" as any)
        .select("*")
        .eq("user_id", clientId)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (error) {
        // Table might not exist yet - return empty array gracefully
        if (error.code === "42P01") {
          console.log("workout_history table doesn't exist");
          return [];
        }
        console.error("Error fetching workout history:", error);
        throw error;
      }

      console.log("Workout history entries:", data?.length || 0);
      return (data || []) as ClientWorkoutHistoryEntry[];
    },
    enabled: !!clientId,
  });
};

/**
 * Hook to fetch exercise statistics from Mobile App
 */
export const useClientExerciseStats = (clientId: string) => {
  return useQuery({
    queryKey: ["client-exercise-stats", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_statistics" as any)
        .select("*")
        .eq("user_id", clientId)
        .order("last_performed_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          console.log("exercise_statistics table doesn't exist");
          return [];
        }
        throw error;
      }

      return data || [];
    },
    enabled: !!clientId,
  });
};
