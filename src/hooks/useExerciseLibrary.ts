import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";

/**
 * Technique section structure from exercise_technique_guides
 */
export interface TechniqueSection {
  title: string;
  bullets: string[];
}

/**
 * Exercise from the main Prometheus library (exercises_new / exercise_view)
 * This contains the 810+ exercises from the Android app
 */
export interface LibraryExercise {
  id: string;
  name: string;
  category: string | null;
  main_muscle_group: string | null;
  secondary_muscle_groups: string[] | null;
  equipment: string[] | null;
  level: string | null;
  visibility: string | null;
  video_url: string | null;
  tutorial: string | null;
  notes: string | null;
  sports: string[] | null;
  vbt_enabled: boolean;
  created_at: string | null;
  owner_id: string | null;
  // Technique guides - structured coaching content
  technique_sections: TechniqueSection[] | null;
  // VBT fields
  vbt_category: string | null;
  vbt_measurement_type: string | null;
  bartracker_enabled: boolean;
  // Tracking options
  track_reps: boolean;
  track_sets: boolean;
  track_weight: boolean;
  track_rpe: boolean;
  track_duration: boolean;
  track_distance: boolean;
  tempo: string | null;
  rest_time_seconds: number | null;
}

/**
 * Mapped exercise type that matches the Coach App's expected format
 * Compatible with the Exercise type from useExercises
 */
export interface MappedExercise {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cloudfront_url: string;
  thumbnail_url: string | null;
  video_filename: string;
  visibility: string;
  created_by: string | null;
  created_at: string;
  primary_muscles: string | null;
  secondary_muscles: string | null;
  equipment: string | null;
  suggested_sets: number | null;
  suggested_reps: string | null;
  suggested_weight: string | null;
  key_aspects: string | null;
  common_mistakes: string | null;
  duration: number | null;
  // Additional fields from library
  level: string | null;
  sports: string[] | null;
  vbt_enabled: boolean;
  // Technique guides - structured coaching content
  technique_sections: TechniqueSection[] | null;
  // VBT fields
  vbt_category: string | null;
  bartracker_enabled: boolean;
  // Tracking configuration
  tempo: string | null;
  rest_time_seconds: number | null;
}

interface UseExerciseLibraryOptions {
  category?: string;
  searchQuery?: string;
  sport?: string;
}

/**
 * Hook to fetch exercises from the main Prometheus library (exercise_view)
 * Maps the Android app's exercise schema to the Coach app's expected format
 */
export const useExerciseLibrary = ({ category, searchQuery, sport }: UseExerciseLibraryOptions = {}) => {
  return useQuery({
    queryKey: ["exercise-library", category, searchQuery, sport],
    queryFn: async () => {
      // Use exercise_view which joins exercises_new with technique_guides
      let query = exerciseLibraryClient
        .from("exercise_view")
        .select("*")
        .order("name", { ascending: true });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      // Filter by sport if provided
      if (sport && sport !== "all") {
        query = query.contains("sports", [sport]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching exercise library:", error);
        throw error;
      }

      // Map the library exercises to the Coach app's expected format
      const mappedExercises: MappedExercise[] = (data as LibraryExercise[]).map((ex) => ({
        id: ex.id,
        title: ex.name,
        description: ex.tutorial || ex.notes || null,
        category: ex.category || ex.main_muscle_group || "general",
        cloudfront_url: ex.video_url || "",
        thumbnail_url: null, // Library exercises don't have separate thumbnails
        video_filename: ex.video_url?.split("/").pop() || "",
        visibility: ex.visibility === "admin" ? "public" : (ex.visibility || "public"),
        created_by: ex.owner_id,
        created_at: ex.created_at || new Date().toISOString(),
        primary_muscles: ex.main_muscle_group,
        secondary_muscles: ex.secondary_muscle_groups?.join(", ") || null,
        equipment: ex.equipment?.join(", ") || null,
        suggested_sets: null,
        suggested_reps: null,
        suggested_weight: null,
        key_aspects: null,
        common_mistakes: null,
        duration: null,
        level: ex.level,
        sports: ex.sports,
        vbt_enabled: ex.vbt_enabled ?? false,
        technique_sections: ex.technique_sections || null,
        vbt_category: ex.vbt_category || null,
        bartracker_enabled: ex.bartracker_enabled ?? false,
        tempo: ex.tempo || null,
        rest_time_seconds: ex.rest_time_seconds || null,
      }));

      return mappedExercises;
    },
  });
};

/**
 * Get unique categories from the exercise library
 */
export const useExerciseCategories = () => {
  return useQuery({
    queryKey: ["exercise-library-categories"],
    queryFn: async () => {
      const { data, error } = await exerciseLibraryClient
        .from("exercises_new")
        .select("category, main_muscle_group")
        .not("category", "is", null);

      if (error) throw error;

      // Get unique categories
      const categories = new Set<string>();
      data?.forEach((ex: any) => {
        if (ex.category) categories.add(ex.category);
        if (ex.main_muscle_group) categories.add(ex.main_muscle_group);
      });

      return Array.from(categories).sort();
    },
  });
};

/**
 * Get unique sports from the exercise library
 */
export const useExerciseSports = () => {
  return useQuery({
    queryKey: ["exercise-library-sports"],
    queryFn: async () => {
      const { data, error } = await exerciseLibraryClient
        .from("exercises_new")
        .select("sports")
        .not("sports", "is", null);

      if (error) throw error;

      // Get unique sports
      const sports = new Set<string>();
      data?.forEach((ex: any) => {
        if (ex.sports) {
          ex.sports.forEach((sport: string) => sports.add(sport));
        }
      });

      return Array.from(sports).sort();
    },
  });
};

/**
 * Fetch a single exercise from the library by ID
 */
export const useLibraryExerciseById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["exercise-library-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("No exercise ID provided");

      // Use exercise_view to get technique_sections joined
      const { data, error } = await exerciseLibraryClient
        .from("exercise_view")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching exercise:", error);
        throw error;
      }

      const ex = data as LibraryExercise;

      // Map to MappedExercise format
      const mappedExercise: MappedExercise = {
        id: ex.id,
        title: ex.name,
        description: ex.tutorial || ex.notes || null,
        category: ex.category || ex.main_muscle_group || "general",
        cloudfront_url: ex.video_url || "",
        thumbnail_url: null,
        video_filename: ex.video_url?.split("/").pop() || "",
        visibility: ex.visibility === "admin" ? "public" : (ex.visibility || "public"),
        created_by: ex.owner_id,
        created_at: ex.created_at || new Date().toISOString(),
        primary_muscles: ex.main_muscle_group,
        secondary_muscles: ex.secondary_muscle_groups?.join(", ") || null,
        equipment: ex.equipment?.join(", ") || null,
        suggested_sets: null,
        suggested_reps: null,
        suggested_weight: null,
        key_aspects: null,
        common_mistakes: null,
        duration: null,
        level: ex.level,
        sports: ex.sports,
        vbt_enabled: ex.vbt_enabled ?? false,
        technique_sections: ex.technique_sections || null,
        vbt_category: ex.vbt_category || null,
        bartracker_enabled: ex.bartracker_enabled ?? false,
        tempo: ex.tempo || null,
        rest_time_seconds: ex.rest_time_seconds || null,
      };

      return mappedExercise;
    },
    enabled: !!id,
  });
};