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
        .eq("client_id", user.id)
        .eq("status", "completed")
        .neq("id", sessionId)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (sessionError) throw sessionError;
      if (!previousSessions || previousSessions.length === 0) return null;

      const sessionIds = previousSessions.map(s => s.id);

      // Get set logs for this exercise from previous sessions
      const { data: setLogs, error: logsError } = await supabase
        .from("set_logs")
        .select("*")
        .eq("exercise_id", exerciseId)
        .in("session_id", sessionIds)
        .order("session_id", { ascending: false })
        .order("set_number", { ascending: true });

      if (logsError) throw logsError;

      // Group by session and return the most recent session's logs
      if (setLogs && setLogs.length > 0) {
        const mostRecentSessionId = setLogs[0].session_id;
        return setLogs.filter(log => log.session_id === mostRecentSessionId);
      }

      return null;
    },
    enabled: !!exerciseId && !!sessionId,
  });
};
