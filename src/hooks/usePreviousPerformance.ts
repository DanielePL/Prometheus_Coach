import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePreviousPerformance = (exerciseId: string, sessionId: string) => {
  return useQuery({
    queryKey: ["previous-performance", exerciseId, sessionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the most recent completed workout session before the current one
      const { data: previousSessions, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .neq("id", sessionId)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (sessionError) throw sessionError;
      if (!previousSessions || previousSessions.length === 0) return null;

      const sessionIds = previousSessions.map(s => s.id);

      // Get workout sets for this exercise from previous sessions (Mobile App uses workout_sets)
      const { data: workoutSets, error: setsError } = await supabase
        .from("workout_sets" as any)
        .select("*")
        .eq("exercise_id", exerciseId)
        .in("session_id", sessionIds)
        .order("session_id", { ascending: false })
        .order("set_number", { ascending: true });

      if (setsError) throw setsError;

      // Group by session and return the most recent session's sets
      if (workoutSets && workoutSets.length > 0) {
        const mostRecentSessionId = workoutSets[0].session_id;
        return workoutSets.filter((set: any) => set.session_id === mostRecentSessionId);
      }

      return null;
    },
    enabled: !!exerciseId && !!sessionId,
  });
};
