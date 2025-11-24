import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MeasurementData {
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  legs?: number;
}

export function useBodyMeasurements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bodyMeasurements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useLatestMeasurements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["latestMeasurements", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", user.id)
        .order("date", { ascending: false })
        .limit(2);

      if (error) throw error;
      
      if (!data || data.length === 0) return null;

      const latest = data[0];
      const previous = data[1];

      return {
        current: latest,
        changes: previous ? {
          chest: latest.chest && previous.chest ? latest.chest - previous.chest : null,
          waist: latest.waist && previous.waist ? latest.waist - previous.waist : null,
          hips: latest.hips && previous.hips ? latest.hips - previous.hips : null,
          arms: latest.arms && previous.arms ? latest.arms - previous.arms : null,
          legs: latest.legs && previous.legs ? latest.legs - previous.legs : null,
        } : null,
      };
    },
    enabled: !!user?.id,
  });
}

export function useSaveMeasurement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MeasurementData) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("body_measurements").insert({
        client_id: user.id,
        date: data.date,
        chest: data.chest,
        waist: data.waist,
        hips: data.hips,
        arms: data.arms,
        legs: data.legs,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyMeasurements"] });
      queryClient.invalidateQueries({ queryKey: ["latestMeasurements"] });
      toast.success("Measurements saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving measurements:", error);
      toast.error("Failed to save measurements");
    },
  });
}
