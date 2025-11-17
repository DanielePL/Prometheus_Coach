import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PersonalRecord {
  id: string;
  client_id: string;
  exercise_id: string;
  weight_used: number;
  reps_completed: number;
  achieved_at: string;
  session_id: string | null;
  created_at: string;
}

// Fetch current PR for a specific exercise
export const usePersonalRecord = (clientId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ["personal-record", clientId, exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_records")
        .select("*")
        .eq("client_id", clientId)
        .eq("exercise_id", exerciseId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data as PersonalRecord | null;
    },
    enabled: !!clientId && !!exerciseId,
  });
};

// Fetch all PRs for a client
export const useClientPersonalRecords = (clientId: string) => {
  return useQuery({
    queryKey: ["personal-records", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_records")
        .select(`
          *,
          exercises (
            id,
            title,
            thumbnail_url,
            primary_muscles
          )
        `)
        .eq("client_id", clientId)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data as (PersonalRecord & { exercises: any })[];
    },
    enabled: !!clientId,
  });
};

// Save or update a personal record
export const useSavePersonalRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: {
      client_id: string;
      exercise_id: string;
      weight_used: number;
      reps_completed: number;
      session_id: string;
    }) => {
      const { data, error } = await supabase
        .from("personal_records")
        .upsert(
          {
            client_id: record.client_id,
            exercise_id: record.exercise_id,
            weight_used: record.weight_used,
            reps_completed: record.reps_completed,
            session_id: record.session_id,
            achieved_at: new Date().toISOString(),
          },
          {
            onConflict: "client_id,exercise_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["personal-record", variables.client_id, variables.exercise_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["personal-records", variables.client_id] 
      });
    },
  });
};

// Check if a set is a new PR
export const checkIsPR = (
  currentPR: PersonalRecord | null | undefined,
  weight: number,
  reps: number
): boolean => {
  if (!currentPR) return true; // First record is always a PR
  
  // PR if weight is higher, or if weight is equal but reps are higher
  if (weight > currentPR.weight_used) return true;
  if (weight === currentPR.weight_used && reps > currentPR.reps_completed) return true;
  
  return false;
};
