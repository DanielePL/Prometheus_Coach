import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deleteExercise = useMutation({
    mutationFn: async ({ exerciseId, videoFilename }: { exerciseId: string; videoFilename: string }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      // Call edge function to delete from S3 and database
      const { data, error } = await supabase.functions.invoke('delete-video-from-s3', {
        body: { exerciseId, videoFilename },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      // Invalidate exercises queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exercise",
        variant: "destructive",
      });
    },
  });

  return {
    deleteExercise: deleteExercise.mutateAsync,
    isDeleting: deleteExercise.isPending,
  };
};
