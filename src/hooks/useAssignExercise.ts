import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssignExerciseParams {
  exerciseId: string;
  exerciseTitle: string;
  clientIds: string[];
  coachId: string;
}

export const useAssignExercise = () => {
  const queryClient = useQueryClient();

  const assignExercise = useMutation({
    mutationFn: async ({ exerciseId, exerciseTitle, clientIds, coachId }: AssignExerciseParams) => {
      // Create workout assignments for each client
      const workouts = clientIds.map((clientId) => ({
        coach_id: coachId,
        client_id: clientId,
        title: exerciseTitle,
        description: `Assigned exercise: ${exerciseTitle}`,
        exercises: [{ exercise_id: exerciseId }],
        status: "not_started",
      }));

      const { data, error } = await supabase
        .from("client_workouts")
        .insert(workouts)
        .select();

      if (error) throw error;

      // Create notifications for each client
      const notifications = clientIds.map((clientId) => ({
        user_id: clientId,
        message: `Your coach assigned you: ${exerciseTitle}`,
      }));

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Failed to create notifications:", notificationError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      const clientCount = variables.clientIds.length;
      toast.success(
        `Assigned to ${clientCount} client${clientCount !== 1 ? "s" : ""}`,
        {
          description: `"${variables.exerciseTitle}" has been assigned successfully`,
        }
      );
      queryClient.invalidateQueries({ queryKey: ["client_workouts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Failed to assign exercise:", error);
      toast.error("Failed to assign exercise", {
        description: "Please try again or check your connection",
      });
    },
  });

  return {
    assignExercise: assignExercise.mutateAsync,
    isAssigning: assignExercise.isPending,
  };
};
