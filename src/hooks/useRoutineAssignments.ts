import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoutineAssignment {
  id: string;
  routine_id: string;
  coach_id: string;
  client_id: string;
  assigned_at: string;
  scheduled_date: string | null;
  notes: string | null;
  status: string;
}

export const useClientRoutineAssignments = () => {
  return useQuery({
    queryKey: ["client-routine-assignments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("routine_assignments")
        .select(`
          *,
          routines (
            *,
            routine_exercises (
              *,
              exercises (*)
            )
          ),
          profiles!routine_assignments_coach_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAssignRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routineId,
      clientIds,
      scheduledDate,
      notes,
    }: {
      routineId: string;
      clientIds: string[];
      scheduledDate?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const assignments = clientIds.map((clientId) => ({
        routine_id: routineId,
        coach_id: user.id,
        client_id: clientId,
        scheduled_date: scheduledDate || null,
        notes: notes || null,
      }));

      const { data, error } = await supabase
        .from("routine_assignments")
        .insert(assignments)
        .select();

      if (error) throw error;

      // Create notifications for each client
      const notifications = clientIds.map((clientId) => ({
        user_id: clientId,
        message: "Your coach assigned you a new workout routine",
      }));

      await supabase.from("notifications").insert(notifications);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routine-assignments"] });
      toast.success(`Routine assigned to ${variables.clientIds.length} client${variables.clientIds.length !== 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error("Failed to assign routine:", error);
      toast.error("Failed to assign routine");
    },
  });
};
