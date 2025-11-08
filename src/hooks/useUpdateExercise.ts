import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ExerciseCategory } from "./useExercises";

interface UpdateExerciseData {
  exerciseId: string;
  updates: {
    title?: string;
    description?: string | null;
    category?: ExerciseCategory;
    primary_muscles?: string | null;
    equipment?: string | null;
    suggested_sets?: number | null;
    suggested_reps?: string | null;
    suggested_weight?: string | null;
    key_aspects?: string | null;
    common_mistakes?: string | null;
  };
}

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateExercise = useMutation({
    mutationFn: async ({ exerciseId, updates }: UpdateExerciseData) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Verify user owns this exercise or is admin
      const { data: exercise, error: fetchError } = await supabase
        .from("exercises")
        .select("created_by")
        .eq("id", exerciseId)
        .single();

      if (fetchError) throw fetchError;

      const { data: isAdmin } = await supabase.rpc("is_admin", {
        _user_id: user.id,
      });

      if (exercise.created_by !== user.id && !isAdmin) {
        throw new Error("Not authorized to edit this exercise");
      }

      // Update exercise
      const { data, error } = await supabase
        .from("exercises")
        .update(updates)
        .eq("id", exerciseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise", data.id] });
      
      toast({
        title: "Success",
        description: "Exercise updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exercise",
        variant: "destructive",
      });
    },
  });

  return {
    updateExercise: updateExercise.mutateAsync,
    isUpdating: updateExercise.isPending,
  };
};
