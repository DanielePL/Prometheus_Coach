import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SetLog {
  id?: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
  completed: boolean;
}

export const useSaveSetLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setLog: SetLog) => {
      const { data, error } = await supabase
        .from("set_logs")
        .upsert({
          id: setLog.id,
          session_id: setLog.session_id,
          exercise_id: setLog.exercise_id,
          set_number: setLog.set_number,
          reps_completed: setLog.reps_completed,
          weight_used: setLog.weight_used,
          completed: setLog.completed,
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
