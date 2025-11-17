import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkoutSession {
  id: string;
  client_id: string;
  routine_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  status: string;
  client_notes: string | null;
  created_at: string;
}

export const useWorkoutSessions = () => {
  return useQuery({
    queryKey: ["workout-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
          )
        `)
        .eq("client_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useWorkoutSession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ["workout-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

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
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useStartWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          client_id: user.id,
          routine_id: routineId,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
      toast.success("Workout started!");
    },
    onError: (error) => {
      console.error("Failed to start workout:", error);
      toast.error("Failed to start workout");
    },
  });
};

export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, clientNotes, durationSeconds }: {
      sessionId: string;
      clientNotes?: string;
      durationSeconds: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get session data to find the coach
      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .select(`
          routine_id,
          routines (
            name,
            coach_id
          )
        `)
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data, error } = await supabase
        .from("workout_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          client_notes: clientNotes,
          duration_seconds: durationSeconds,
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for coach
      if (session.routines?.coach_id) {
        await supabase.from("notifications").insert({
          user_id: session.routines.coach_id,
          message: `Your client completed a workout: ${session.routines.name}`,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
      toast.success("Workout completed! 🎉");
    },
    onError: (error) => {
      console.error("Failed to complete workout:", error);
      toast.error("Failed to complete workout");
    },
  });
};
