import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCoachNotes = (clientId: string) => {
  return useQuery({
    queryKey: ["coach-notes", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
};
