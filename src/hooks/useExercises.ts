import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";

export type Exercise = Tables<"exercises">;
export type ExerciseCategory = Enums<"exercise_category">;

interface UseExercisesOptions {
  category?: ExerciseCategory;
  searchQuery?: string;
}

export const useExercises = ({ category, searchQuery }: UseExercisesOptions = {}) => {
  return useQuery({
    queryKey: ["exercises", category, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("exercises")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Exercise[];
    },
  });
};
