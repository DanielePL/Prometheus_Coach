import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientWorkoutSession {
  id: string;
  client_id: string;
  routine_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  status: string;
  client_notes: string | null;
  created_at: string;
  routines?: {
    name: string;
    description: string | null;
    routine_exercises?: Array<{
      id: string;
      exercise_id: string;
      order_index: number;
      sets: number;
      reps_min: number | null;
      reps_max: number | null;
      rest_seconds: number;
      exercises?: {
        id: string;
        title: string;
        category: string;
      };
    }>;
  };
  set_logs?: Array<{
    id: string;
    exercise_id: string;
    set_number: number;
    reps_completed: number | null;
    weight_used: number | null;
    completed: boolean;
  }>;
}

/**
 * Hook for coaches to view their client's workout sessions
 */
export const useClientWorkoutSessions = (clientId: string) => {
  return useQuery({
    queryKey: ["client-workout-sessions", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select(`
          *,
          routines (
            name,
            description,
            routine_exercises (
              *,
              exercises (*)
            )
          ),
          set_logs (*)
        `)
        .eq("client_id", clientId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as ClientWorkoutSession[];
    },
    enabled: !!clientId,
  });
};
