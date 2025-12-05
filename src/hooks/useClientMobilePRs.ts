import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
