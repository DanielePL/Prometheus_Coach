import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface CoachGoal {
  id: string;
  coach_id: string;
  text: string;
  completed: boolean;
  date: string;
}

export function useCoachGoals(date?: Date) {
  const { user } = useAuth();
  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["coachGoals", user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("coach_goals")
        .select("*")
        .eq("coach_id", user.id)
        .eq("date", dateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CoachGoal[];
    },
    enabled: !!user?.id,
  });
}

export function useAddCoachGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, date }: { text: string; date?: Date }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const dateStr = format(date || new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("coach_goals")
        .insert({
          coach_id: user.id,
          text,
          date: dateStr,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coachGoals"] });
    },
  });
}

export function useUpdateCoachGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text, completed }: { id: string; text?: string; completed?: boolean }) => {
      const updates: Partial<CoachGoal> = {};
      if (text !== undefined) updates.text = text;
      if (completed !== undefined) updates.completed = completed;

      const { data, error } = await supabase
        .from("coach_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coachGoals"] });
    },
  });
}

export function useDeleteCoachGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coach_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coachGoals"] });
    },
  });
}
