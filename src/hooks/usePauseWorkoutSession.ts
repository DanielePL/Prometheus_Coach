import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PauseWorkoutParams {
  sessionId: string;
  currentExerciseIndex: number;
  elapsedSeconds: number;
}

export function usePauseWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, currentExerciseIndex, elapsedSeconds }: PauseWorkoutParams) => {
      const { error } = await supabase
        .from("workout_sessions")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
          current_exercise_index: currentExerciseIndex,
          paused_elapsed_seconds: elapsedSeconds,
        })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutSessions"] });
      toast.success("Workout paused", {
        description: "Your progress has been saved. Resume anytime!",
      });
    },
    onError: (error) => {
      console.error("Error pausing workout:", error);
      toast.error("Failed to pause workout");
    },
  });
}
