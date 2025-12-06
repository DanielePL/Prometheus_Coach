import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * WorkoutSet - Mobile App schema
 */
export interface WorkoutSet {
  id?: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  completed_at: string | null;
  velocity_metrics?: any;
  video_url?: string | null;
}

/**
 * Legacy SetLog interface for backwards compatibility
 * @deprecated Use WorkoutSet instead
 */
export interface SetLog {
  id?: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
  completed: boolean;
}

/**
 * Convert legacy SetLog to WorkoutSet format
 */
export const setLogToWorkoutSet = (setLog: SetLog): WorkoutSet => ({
  id: setLog.id,
  session_id: setLog.session_id,
  exercise_id: setLog.exercise_id,
  set_number: setLog.set_number,
  reps: setLog.reps_completed,
  weight_kg: setLog.weight_used, // Note: might need unit conversion
  completed_at: setLog.completed ? new Date().toISOString() : null,
});

/**
 * Save a workout set to the database
 * Uses Mobile App's workout_sets table
 */
export const useSaveWorkoutSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutSet: WorkoutSet) => {
      const { data, error } = await supabase
        .from("workout_sets" as any)
        .upsert({
          id: workoutSet.id,
          session_id: workoutSet.session_id,
          exercise_id: workoutSet.exercise_id,
          set_number: workoutSet.set_number,
          reps: workoutSet.reps,
          weight_kg: workoutSet.weight_kg,
          completed_at: workoutSet.completed_at,
          velocity_metrics: workoutSet.velocity_metrics,
          video_url: workoutSet.video_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-session", variables.session_id] });
    },
  });
};

/**
 * @deprecated Use useSaveWorkoutSet instead
 * Legacy hook for backwards compatibility
 */
export const useSaveSetLog = () => {
  const saveWorkoutSet = useSaveWorkoutSet();

  return {
    ...saveWorkoutSet,
    mutate: (setLog: SetLog) => {
      saveWorkoutSet.mutate(setLogToWorkoutSet(setLog));
    },
    mutateAsync: async (setLog: SetLog) => {
      return saveWorkoutSet.mutateAsync(setLogToWorkoutSet(setLog));
    },
  };
};
