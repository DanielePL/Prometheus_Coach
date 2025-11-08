import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Event } from "@/components/ui/event-manager";

interface DatabaseEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  event_type: string;
  created_by: string;
  assigned_to: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

const mapDatabaseEventToEvent = (dbEvent: DatabaseEvent): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description || "",
  startTime: new Date(dbEvent.start_time),
  endTime: new Date(dbEvent.end_time),
  color: dbEvent.color as Event["color"],
  category: dbEvent.event_type,
  tags: [],
});

export const useEvents = () => {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data as DatabaseEvent[]).map(mapDatabaseEventToEvent);
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<Event> & { assigned_to?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: event.title!,
          description: event.description || null,
          start_time: event.startTime!.toISOString(),
          end_time: event.endTime!.toISOString(),
          event_type: event.category || "other",
          color: event.color || "gray",
          created_by: user.id,
          assigned_to: event.assigned_to || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create event: " + error.message);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Event> & { assigned_to?: string | null } }) => {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
      if (updates.category) updateData.event_type = updates.category;
      if (updates.color) updateData.color = updates.color;
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;

      const { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete event: " + error.message);
    },
  });

  return {
    events,
    isLoading,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
  };
};
