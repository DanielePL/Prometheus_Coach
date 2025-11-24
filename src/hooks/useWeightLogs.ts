import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

export function useLatestWeight() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["latestWeight", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("client_id", user.id)
        .order("date", { ascending: false })
        .limit(2);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const latest = data[0];
      const previous = data[1];

      const change = previous ? latest.weight - previous.weight : 0;
      const changePercent = previous ? ((change / previous.weight) * 100) : 0;

      return {
        current: latest.weight,
        change,
        changePercent: changePercent.toFixed(1),
        date: latest.date,
      };
    },
    enabled: !!user?.id,
  });
}

interface WeightLogData {
  weight: number;
  date: string;
  notes?: string;
}

export function useSaveWeightLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WeightLogData) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("weight_logs").insert({
        client_id: user.id,
        weight: data.weight,
        date: data.date,
        notes: data.notes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
      queryClient.invalidateQueries({ queryKey: ["latestWeight"] });
      toast.success("Weight logged successfully!");
    },
    onError: (error) => {
      console.error("Error saving weight:", error);
      toast.error("Failed to log weight");
    },
  });
}
