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
  is_recurring?: boolean;
  parent_event_id?: string | null;
  reminders?: number[];
  video_link?: string | null;
  creator?: {
    full_name: string;
  };
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
  assigned_to: dbEvent.assigned_to,
  created_by_name: dbEvent.creator?.full_name,
  created_by: dbEvent.created_by,
  is_recurring: dbEvent.is_recurring,
  parent_event_id: dbEvent.parent_event_id,
  reminders: dbEvent.reminders || [],
  video_link: dbEvent.video_link || undefined,
});

export const useEvents = () => {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:profiles!events_created_by_fkey(full_name)
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data as DatabaseEvent[]).map(mapDatabaseEventToEvent);
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<Event> & { assigned_to?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const insertData: any = {
        title: event.title!,
        description: event.description || null,
        start_time: event.startTime!.toISOString(),
        end_time: event.endTime!.toISOString(),
        event_type: event.category || "other",
        color: event.color || "gray",
        created_by: user.id,
        assigned_to: event.assigned_to || null,
        reminders: event.reminders || [],
        video_link: event.video_link || null,
      };

      // Add recurring fields if applicable
      if (event.is_recurring) {
        insertData.is_recurring = true;
        insertData.recurrence_pattern = event.recurrence_pattern;
        insertData.recurrence_interval = event.recurrence_interval || 1;
        insertData.recurrence_days = event.recurrence_days || null;
        insertData.recurrence_end_date = event.recurrence_end_date?.toISOString() || null;
      }

      const { data, error } = await supabase
        .from("events")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (variables.is_recurring) {
        toast.success("Recurring event created successfully! Individual instances have been generated.");
      } else {
        toast.success("Event created successfully");
      }
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
      if (updates.reminders !== undefined) updateData.reminders = updates.reminders;
      if (updates.video_link !== undefined) updateData.video_link = updates.video_link || null;

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
