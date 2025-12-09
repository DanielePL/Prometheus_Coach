import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkoutTemplateExercise {
  id: string;
  workout_template_id: string;
  exercise_id: string;
  order_index: number;
  created_at: string;
  // Joined exercise details
  exercise?: {
    id: string;
    title: string;
    category: string;
    thumbnail_url: string | null;
    primary_muscles: string | null;
    equipment: string | null;
  };
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  user_id: string | null;
  sports: string[] | null;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutTemplateExercise[];
  exercise_count?: number;
}

export const useWorkoutTemplates = (options?: {
  userId?: string;
  includePublic?: boolean;
  sport?: string;
}) => {
  return useQuery({
    queryKey: ["workout-templates", options?.userId, options?.includePublic, options?.sport],
    queryFn: async (): Promise<WorkoutTemplate[]> => {
      let query = supabase
        .from("workout_templates")
        .select(`
          *,
          workout_template_exercises (
            id,
            exercise_id,
            order_index,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      // If userId is provided, filter by user
      if (options?.userId) {
        if (options.includePublic) {
          // Get user's templates + public templates (where user_id is null)
          query = query.or(`user_id.eq.${options.userId},user_id.is.null`);
        } else {
          query = query.eq("user_id", options.userId);
        }
      } else if (options?.includePublic !== false) {
        // By default, get public templates (user_id is null)
        query = query.is("user_id", null);
      }

      // Filter by sport if provided
      if (options?.sport && options.sport !== "all") {
        query = query.contains("sports", [options.sport]);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("workout_templates table not found - returning empty array");
          return [];
        }
        console.error("Error fetching workout templates:", error);
        throw error;
      }

      // Map the data to include exercise count
      return (data || []).map((template: any) => ({
        ...template,
        exercise_count: template.workout_template_exercises?.length || 0,
        exercises: template.workout_template_exercises || [],
      }));
    },
    retry: false, // Don't retry if table doesn't exist
  });
};

export const useWorkoutTemplate = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ["workout-template", templateId],
    queryFn: async (): Promise<WorkoutTemplate | null> => {
      if (!templateId) return null;

      // Fetch template with exercises and their details
      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        console.error("Error fetching workout template:", templateError);
        throw templateError;
      }

      // Fetch exercises for this template
      const { data: templateExercises, error: exercisesError } = await supabase
        .from("workout_template_exercises")
        .select(`
          id,
          workout_template_id,
          exercise_id,
          order_index,
          created_at
        `)
        .eq("workout_template_id", templateId)
        .order("order_index", { ascending: true });

      if (exercisesError) {
        console.error("Error fetching template exercises:", exercisesError);
        throw exercisesError;
      }

      // Fetch exercise details for each exercise
      if (templateExercises && templateExercises.length > 0) {
        const exerciseIds = templateExercises.map((te: any) => te.exercise_id);

        const { data: exercises, error: detailsError } = await supabase
          .from("exercises")
          .select("id, title, category, thumbnail_url, primary_muscles, equipment")
          .in("id", exerciseIds);

        if (detailsError) {
          console.error("Error fetching exercise details:", detailsError);
        }

        // Map exercise details to template exercises
        const exerciseMap = new Map(exercises?.map((e: any) => [e.id, e]) || []);
        const enrichedExercises = templateExercises.map((te: any) => ({
          ...te,
          exercise: exerciseMap.get(te.exercise_id) || null,
        }));

        return {
          ...template,
          exercises: enrichedExercises,
          exercise_count: enrichedExercises.length,
        };
      }

      return {
        ...template,
        exercises: [],
        exercise_count: 0,
      };
    },
    enabled: !!templateId,
  });
};
