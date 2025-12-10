import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PhotoUpload {
  date: string;
  photo_url: string;
  type?: string;
}

export function useProgressPhotos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["progressPhotos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("client_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useClientProgressPhotos(clientId: string) {
  return useQuery({
    queryKey: ["clientProgressPhotos", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useUploadProgressPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, date, type }: { file: File; date: string; type?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("progress_photos").insert({
        client_id: user.id,
        date,
        photo_url: publicUrl,
        type,
      });

      if (dbError) throw dbError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
      toast.success("Photo uploaded successfully!");
    },
    onError: (error) => {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    },
  });
}
