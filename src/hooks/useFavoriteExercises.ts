import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavoriteExercises = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorite-exercises", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_favorite_exercises")
        .select("*, exercises(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!user) throw new Error("Must be logged in");

      const existing = favorites.find((f) => f.exercise_id === exerciseId);

      if (existing) {
        const { error } = await supabase
          .from("user_favorite_exercises")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        return { action: "removed" };
      } else {
        const { error } = await supabase
          .from("user_favorite_exercises")
          .insert({ user_id: user.id, exercise_id: exerciseId });

        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorite-exercises"] });
      toast.success(
        result.action === "added"
          ? "Added to favorites"
          : "Removed from favorites"
      );
    },
    onError: (error) => {
      toast.error("Failed to update favorites");
      console.error(error);
    },
  });

  const isFavorite = (exerciseId: string) => {
    return favorites.some((f) => f.exercise_id === exerciseId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite: toggleFavorite.mutate,
    isFavorite,
  };
};
