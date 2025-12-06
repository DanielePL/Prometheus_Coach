import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * PersonalRecord from Mobile App (stored in user_profiles.personal_records)
 */
export interface MobilePersonalRecord {
  exercise_name: string;
  value: number;
  unit: string; // "kg", "reps", "min:sec", "pts"
  achieved_at: number; // Unix timestamp in milliseconds
  sport: string; // "Olympic Weightlifting", "Powerlifting", etc.
}

/**
 * User profile from Mobile App
 */
export interface MobileUserProfile {
  id: string;
  name: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  personal_records: Record<string, MobilePersonalRecord>;
  profile_image_url: string | null;
}

/**
 * Formatted PR for display
 */
export interface FormattedPR {
  exerciseName: string;
  value: number;
  unit: string;
  achievedAt: Date;
  sport: string;
}

/**
 * Hook to fetch PRs from Mobile App's user_profiles table
 */
export const useClientMobilePRs = (clientId: string) => {
  return useQuery({
    queryKey: ["mobile-prs", clientId],
    queryFn: async () => {
      console.log("Fetching Mobile PRs for clientId:", clientId);

      // Query user_profiles table directly (no types defined, use any)
      const { data, error } = await supabase
        .from("user_profiles" as any)
        .select("id, name, personal_records")
        .eq("id", clientId)
        .single();

      console.log("user_profiles result:", { data, error });

      if (error) {
        console.error("Error fetching user_profiles:", error);
        throw error; // Let React Query handle the error
      }

      if (!data) {
        return { prs: [], totalPRs: 0, profile: null };
      }

      const profile = data as MobileUserProfile;
      const personalRecords = profile.personal_records || {};

      // Convert Map to array of FormattedPR
      const prs: FormattedPR[] = Object.values(personalRecords).map((pr) => ({
        exerciseName: pr.exercise_name,
        value: pr.value,
        unit: pr.unit,
        achievedAt: new Date(pr.achieved_at),
        sport: pr.sport,
      }));

      // Sort by value descending (highest PR first)
      prs.sort((a, b) => b.value - a.value);

      console.log("Formatted PRs:", prs);

      return {
        prs,
        totalPRs: prs.length,
        profile: {
          name: profile.name,
          id: profile.id,
        },
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Mutation to update a PR
 */
export const useUpdateClientPR = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pr: {
      exerciseName: string;
      value: number;
      unit: string;
      sport: string;
    }) => {
      // First get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("user_profiles" as any)
        .select("personal_records")
        .eq("id", clientId)
        .single();

      if (fetchError) throw fetchError;

      const currentRecords = (profile as any)?.personal_records || {};

      // Update or add the PR
      const updatedRecords = {
        ...currentRecords,
        [pr.exerciseName]: {
          exercise_name: pr.exerciseName,
          value: pr.value,
          unit: pr.unit,
          sport: pr.sport,
          achieved_at: Date.now(),
        },
      };

      // Save back to database
      const { error: updateError } = await supabase
        .from("user_profiles" as any)
        .update({ personal_records: updatedRecords })
        .eq("id", clientId);

      if (updateError) throw updateError;

      return pr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-prs", clientId] });
      toast.success("PR updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update PR:", error);
      toast.error("Failed to update PR");
    },
  });
};

/**
 * Mutation to delete a PR
 */
export const useDeleteClientPR = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseName: string) => {
      // First get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("user_profiles" as any)
        .select("personal_records")
        .eq("id", clientId)
        .single();

      if (fetchError) throw fetchError;

      const currentRecords = (profile as any)?.personal_records || {};

      // Remove the PR
      const { [exerciseName]: removed, ...remainingRecords } = currentRecords;

      // Save back to database
      const { error: updateError } = await supabase
        .from("user_profiles" as any)
        .update({ personal_records: remainingRecords })
        .eq("id", clientId);

      if (updateError) throw updateError;

      return exerciseName;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-prs", clientId] });
      toast.success("PR deleted");
    },
    onError: (error) => {
      console.error("Failed to delete PR:", error);
      toast.error("Failed to delete PR");
    },
  });
};
