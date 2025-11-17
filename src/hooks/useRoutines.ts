import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Routine {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useRoutines = () => {
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
      return data as Routine[];
    },
  });
};

export const useRoutine = (routineId: string | undefined) => {
  return useQuery({
    queryKey: ["routine", routineId],
    queryFn: async () => {
      if (!routineId) return null;

      const { data, error } = await supabase
        .from("routines")
        .select(`
          *,
          routine_exercises (
            *,
            exercises (*)
          )
        `)
        .eq("id", routineId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!routineId,
  });
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("routines")
        .insert({
          coach_id: user.id,
          name: routine.name,
          description: routine.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine created successfully");
    },
    onError: (error) => {
      console.error("Failed to create routine:", error);
      toast.error("Failed to create routine");
    },
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Routine> & { id: string }) => {
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
      toast.success("Routine updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update routine:", error);
      toast.error("Failed to update routine");
    },
  });
};

export const useDeleteRoutine = () => {
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
      toast.success("Routine deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete routine:", error);
      toast.error("Failed to delete routine");
    },
  });
};
