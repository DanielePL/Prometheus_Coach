import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpcomingVideoEvent {
  id: string;
  title: string;
  start_time: string;
  video_link: string;
}

export const useClientVideoLink = (clientId: string) => {
  return useQuery({
    queryKey: ["clientVideoLink", clientId],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Find the next upcoming event for this client that has a video link
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_time, video_link")
        .eq("assigned_to", clientId)
        .not("video_link", "is", null)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

      return data as UpcomingVideoEvent | null;
    },
    enabled: !!clientId,
  });
};
