import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProgramTemplatePhase {
  id: string;
  program_template_id: string;
  name: string;
  training_phase_id: string | null;
  start_week: number;
  duration_weeks: number;
  volume_modifier: number | null;
  intensity_modifier: number | null;
  description: string | null;
  sort_order: number | null;
}

export interface ProgramTemplateWeek {
  id: string;
  program_template_id: string;
  week_number: number;
  phase_id: string | null;
  name: string | null;
  description: string | null;
  is_deload: boolean;
  volume_modifier: number | null;
  intensity_modifier: number | null;
}

export interface ProgramTemplateDay {
  id: string;
  program_template_week_id: string;
  workout_template_id: string | null;
  day_of_week: number | null;
  day_name: string | null;
  notes: string | null;
  sort_order: number | null;
  // Joined workout template
  workout_template?: {
    id: string;
    name: string;
  } | null;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string | null;
  sport_type_id: string | null;
  difficulty: string | null;
  duration_weeks: number;
  days_per_week: number | null;
  periodization_type: string | null;
  goal_tags: string[] | null;
  equipment_required: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Nested structure
  phases?: ProgramTemplatePhase[];
  weeks?: ProgramTemplateWeek[];
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_template_id: string | null;
  name: string;
  description: string | null;
  sport_type_id: string | null;
  difficulty: string | null;
  duration_weeks: number;
  days_per_week: number | null;
  periodization_type: string | null;
  current_week: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useProgramTemplates = (options?: {
  sportTypeId?: string;
  difficulty?: string;
  includePrivate?: boolean;
}) => {
  return useQuery({
    queryKey: ["program-templates", options?.sportTypeId, options?.difficulty, options?.includePrivate],
    queryFn: async (): Promise<ProgramTemplate[]> => {
      let query = supabase
        .from("program_templates")
        .select("*")
        .order("created_at", { ascending: false });

      // By default only show public templates
      if (!options?.includePrivate) {
        query = query.eq("is_public", true);
      }

      // Filter by sport type
      if (options?.sportTypeId && options.sportTypeId !== "all") {
        query = query.eq("sport_type_id", options.sportTypeId);
      }

      // Filter by difficulty
      if (options?.difficulty && options.difficulty !== "all") {
        query = query.eq("difficulty", options.difficulty);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("program_templates table not found - returning empty array");
          return [];
        }
        console.error("Error fetching program templates:", error);
        throw error;
      }

      return data || [];
    },
    retry: false, // Don't retry if table doesn't exist
  });
};

export const useProgramTemplate = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ["program-template", templateId],
    queryFn: async (): Promise<ProgramTemplate | null> => {
      if (!templateId) return null;

      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from("program_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        console.error("Error fetching program template:", templateError);
        throw templateError;
      }

      // Fetch phases
      const { data: phases, error: phasesError } = await supabase
        .from("program_template_phases")
        .select("*")
        .eq("program_template_id", templateId)
        .order("sort_order", { ascending: true });

      if (phasesError) {
        console.error("Error fetching program phases:", phasesError);
      }

      // Fetch weeks
      const { data: weeks, error: weeksError } = await supabase
        .from("program_template_weeks")
        .select("*")
        .eq("program_template_id", templateId)
        .order("week_number", { ascending: true });

      if (weeksError) {
        console.error("Error fetching program weeks:", weeksError);
      }

      return {
        ...template,
        phases: phases || [],
        weeks: weeks || [],
      };
    },
    enabled: !!templateId,
  });
};

export const useUserPrograms = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-programs", userId],
    queryFn: async (): Promise<UserProgram[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_programs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("user_programs table not found - returning empty array");
          return [];
        }
        console.error("Error fetching user programs:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    retry: false, // Don't retry if table doesn't exist
  });
};

// Helper functions for display
export const getDifficultyDisplay = (difficulty: string | null): string => {
  if (!difficulty) return "All Levels";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
};

export const getSportDisplay = (sportTypeId: string | null): string => {
  if (!sportTypeId) return "General";
  return sportTypeId
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getGoalsDisplay = (goalTags: string[] | null): string => {
  if (!goalTags || goalTags.length === 0) return "";
  return goalTags
    .map(tag => tag.replace(/_/g, " ").toLowerCase())
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
    .join(", ");
};
