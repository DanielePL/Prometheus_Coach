import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MeasurementData {
  date: string;
  neck?: number;
  shoulders?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  glutes?: number;
  arms?: number;
  forearms?: number;
  legs?: number;
  calves?: number;
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
          neck: latest.neck && previous.neck ? latest.neck - previous.neck : null,
          shoulders: latest.shoulders && previous.shoulders ? latest.shoulders - previous.shoulders : null,
          chest: latest.chest && previous.chest ? latest.chest - previous.chest : null,
          waist: latest.waist && previous.waist ? latest.waist - previous.waist : null,
          hips: latest.hips && previous.hips ? latest.hips - previous.hips : null,
          glutes: latest.glutes && previous.glutes ? latest.glutes - previous.glutes : null,
          arms: latest.arms && previous.arms ? latest.arms - previous.arms : null,
          forearms: latest.forearms && previous.forearms ? latest.forearms - previous.forearms : null,
          legs: latest.legs && previous.legs ? latest.legs - previous.legs : null,
          calves: latest.calves && previous.calves ? latest.calves - previous.calves : null,
        } : null,
      };
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook for coaches to get client body measurements
 */
export function useClientBodyMeasurements(clientId: string) {
  return useQuery({
    queryKey: ["clientBodyMeasurements", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

/**
 * Hook for coaches to get client's latest measurements with changes
 */
export function useClientLatestMeasurements(clientId: string) {
  return useQuery({
    queryKey: ["clientLatestMeasurements", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(2);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const latest = data[0];
      const previous = data[1];

      return {
        current: latest,
        previous: previous || null,
        changes: previous ? {
          neck: latest.neck && previous.neck ? latest.neck - previous.neck : null,
          shoulders: latest.shoulders && previous.shoulders ? latest.shoulders - previous.shoulders : null,
          chest: latest.chest && previous.chest ? latest.chest - previous.chest : null,
          waist: latest.waist && previous.waist ? latest.waist - previous.waist : null,
          hips: latest.hips && previous.hips ? latest.hips - previous.hips : null,
          glutes: latest.glutes && previous.glutes ? latest.glutes - previous.glutes : null,
          arms: latest.arms && previous.arms ? latest.arms - previous.arms : null,
          forearms: latest.forearms && previous.forearms ? latest.forearms - previous.forearms : null,
          legs: latest.legs && previous.legs ? latest.legs - previous.legs : null,
          calves: latest.calves && previous.calves ? latest.calves - previous.calves : null,
        } : null,
        lastUpdated: latest.date,
      };
    },
    enabled: !!clientId,
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
        neck: data.neck,
        shoulders: data.shoulders,
        chest: data.chest,
        waist: data.waist,
        hips: data.hips,
        glutes: data.glutes,
        arms: data.arms,
        forearms: data.forearms,
        legs: data.legs,
        calves: data.calves,
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
