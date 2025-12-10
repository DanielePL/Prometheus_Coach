import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkoutExercise {
  id?: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number;
  notes: string | null;
}

// Backwards compatible alias
export type RoutineExercise = WorkoutExercise;

export const useSaveWorkoutExercises = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routineId, exercises }: { routineId: string; exercises: WorkoutExercise[] }) => {
      console.log("=== SAVING WORKOUT EXERCISES ===");
      console.log("Workout ID:", routineId);
      console.log("Number of exercises to save:", exercises.length);
      console.log("Exercises data:", JSON.stringify(exercises, null, 2));

      // First, delete existing exercises for this workout
      console.log("Step 1: Deleting existing exercises...");
      const { error: deleteError } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("routine_id", routineId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
      console.log("Existing exercises deleted successfully");

      // Then insert the new exercises
      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, index) => ({
          routine_id: routineId,
          exercise_id: ex.exercise_id,
          order_index: index,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
        }));

        console.log("Step 2: Inserting new exercises...");
        console.log("Data to insert:", JSON.stringify(exercisesToInsert, null, 2));

        const { data, error: insertError } = await supabase
          .from("routine_exercises")
          .insert(exercisesToInsert)
          .select();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        console.log("Exercises inserted successfully:", data);
        console.log("Number of exercises inserted:", data?.length);
        return data;
      } else {
        console.log("No exercises to insert");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routine", variables.routineId] });
      toast.success("Workout exercises saved");
    },
    onError: (error) => {
      console.error("Failed to save workout exercises:", error);
      toast.error("Failed to save exercises");
    },
  });
};
