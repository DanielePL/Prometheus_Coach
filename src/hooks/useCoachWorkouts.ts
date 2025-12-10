import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoachWorkout {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Backwards compatible alias
export type Routine = CoachWorkout;

export const useCoachWorkouts = () => {
  return useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CoachWorkout[];
    },
  });
};

export const useCoachWorkout = (workoutId: string | undefined) => {
  return useQuery({
    queryKey: ["routine", workoutId],
    queryFn: async () => {
      if (!workoutId) return null;

      const { data, error } = await supabase
        .from("routines")
        .select(`
          *,
          routine_exercises (
            id,
            exercise_id,
            order_index,
            sets,
            reps_min,
            reps_max,
            rest_seconds,
            notes,
            exercises (
              id,
              title,
              thumbnail_url
            )
          )
        `)
        .eq("id", workoutId)
        .order("order_index", { ascending: true, foreignTable: "routine_exercises" })
        .single();

      if (error) {
        console.error("Error fetching workout:", error);
        throw error;
      }

      console.log("Workout data loaded:", data);
      return data;
    },
    enabled: !!workoutId,
  });
};

export const useCreateCoachWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: { name: string; description?: string }) => {
      console.log("=== CREATING NEW WORKOUT ===");
      console.log("Workout data:", JSON.stringify(workout, null, 2));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        throw new Error("Not authenticated");
      }
      console.log("User authenticated:", user.id);

      const workoutToInsert = {
        coach_id: user.id,
        name: workout.name,
        description: workout.description,
      };
      console.log("Data to insert:", JSON.stringify(workoutToInsert, null, 2));

      const { data, error } = await supabase
        .from("routines")
        .insert(workoutToInsert)
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Workout created successfully:", data);
      console.log("New workout ID:", data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Workout created successfully");
    },
    onError: (error) => {
      console.error("Failed to create workout:", error);
      toast.error("Failed to create workout");
    },
  });
};

export const useUpdateCoachWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CoachWorkout> & { id: string }) => {
      const { data, error } = await supabase
        .from("routines")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Workout updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update workout:", error);
      toast.error("Failed to update workout");
    },
  });
};

export const useDeleteCoachWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Workout deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete workout:", error);
      toast.error("Failed to delete workout");
    },
  });
};
