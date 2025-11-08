import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export const useGoals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user?.id,
  });

  const addGoalMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user?.id) throw new Error("No user logged in");
      
      const { data, error } = await supabase
        .from("goals")
        .insert({ text, user_id: user.id, completed: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal added");
    },
    onError: (error) => {
      toast.error("Failed to add goal");
      console.error("Add goal error:", error);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, text, completed }: { id: string; text?: string; completed?: boolean }) => {
      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (completed !== undefined) updates.completed = completed;

      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      toast.error("Failed to update goal");
      console.error("Update goal error:", error);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete goal");
      console.error("Delete goal error:", error);
    },
  });

  return {
    goals,
    isLoading,
    addGoal: addGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
  };
};
