import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWeightLogs = (clientId: string) => {
  return useQuery({
    queryKey: ["weight-logs", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
};
