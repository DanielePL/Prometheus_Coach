import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientWorkoutSession {
  id: string;
  user_id: string;
  client_id?: string; // Deprecated: use user_id
  routine_id: string;
  workout_name?: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  duration_minutes?: number | null;
  status: string;
  client_notes: string | null;
  notes?: string | null;
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
  // Mobile App uses workout_sets instead of set_logs
  workout_sets?: Array<{
    id: string;
    exercise_id: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    completed_at: string | null;
    velocity_metrics?: any;
  }>;
  // Legacy: Coach app set_logs (deprecated, use workout_sets)
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
 * Checks both client_id (coach-assigned) and user_id (mobile app) for compatibility
 */
export const useClientWorkoutSessions = (clientId: string) => {
  return useQuery({
    queryKey: ["client-workout-sessions", clientId],
    queryFn: async () => {
      // First, get sessions with routines
      // Use user_id for Mobile App compatibility
      const { data: sessions, error: sessionsError } = await supabase
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
          )
        `)
        .eq("user_id", clientId)
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);

      // Get workout_sets from Mobile App table
      const { data: workoutSetsData, error: setsError } = await supabase
        .from("workout_sets" as any)
        .select("*")
        .in("session_id", sessionIds);

      if (setsError) {
        console.error("Error fetching workout_sets:", setsError);
      }

      const workoutSets = (workoutSetsData || []) as any[];

      // Attach sets to sessions
      const sessionsWithSets = sessions.map(session => ({
        ...session,
        workout_sets: workoutSets.filter(s => s.session_id === session.id),
      }));

      return sessionsWithSets as unknown as ClientWorkoutSession[];
    },
    enabled: !!clientId,
  });
};
