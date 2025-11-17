import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoutineExercise {
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

export const useSaveRoutineExercises = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routineId, exercises }: { routineId: string; exercises: RoutineExercise[] }) => {
      // First, delete existing exercises for this routine
      const { error: deleteError } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("routine_id", routineId);

      if (deleteError) throw deleteError;

      // Then insert the new exercises
      if (exercises.length > 0) {
        const { data, error: insertError } = await supabase
          .from("routine_exercises")
          .insert(
            exercises.map((ex, index) => ({
              routine_id: routineId,
              exercise_id: ex.exercise_id,
              order_index: index,
              sets: ex.sets,
              reps_min: ex.reps_min,
              reps_max: ex.reps_max,
              rest_seconds: ex.rest_seconds,
              notes: ex.notes,
            }))
          )
          .select();

        if (insertError) throw insertError;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routine", variables.routineId] });
      toast.success("Routine exercises saved");
    },
    onError: (error) => {
      console.error("Failed to save routine exercises:", error);
      toast.error("Failed to save exercises");
    },
  });
};
