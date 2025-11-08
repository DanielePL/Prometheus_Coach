import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BlockedTimeSlot {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  reason?: string;
}

export function useBlockedTimeSlots(userId?: string) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockedSlots();
  }, [userId]);

  const fetchBlockedSlots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("blocked_time_slots")
        .select("*")
        .eq("user_id", targetUserId)
        .order("start_time");

      if (error) throw error;

      setBlockedSlots(
        (data || []).map((slot) => ({
          ...slot,
          start_time: new Date(slot.start_time),
          end_time: new Date(slot.end_time),
        }))
      );
    } catch (error) {
      console.error("Error fetching blocked time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load blocked time slots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBlockedSlot = async (
    title: string,
    startTime: Date,
    endTime: Date,
    reason?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("blocked_time_slots")
        .insert({
          user_id: user.id,
          title,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason,
        });

      if (error) throw error;

      await fetchBlockedSlots();
      toast({
        title: "Success",
        description: "Time blocked successfully",
      });
    } catch (error) {
      console.error("Error creating blocked slot:", error);
      toast({
        title: "Error",
        description: "Failed to block time",
        variant: "destructive",
      });
    }
  };

  const updateBlockedSlot = async (
    id: string,
    updates: Partial<Omit<BlockedTimeSlot, "id">>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.start_time) updateData.start_time = updates.start_time.toISOString();
      if (updates.end_time) updateData.end_time = updates.end_time.toISOString();
      if (updates.reason !== undefined) updateData.reason = updates.reason;

      const { error } = await supabase
        .from("blocked_time_slots")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBlockedSlots();
      toast({
        title: "Success",
        description: "Blocked time updated",
      });
    } catch (error) {
      console.error("Error updating blocked slot:", error);
      toast({
        title: "Error",
        description: "Failed to update blocked time",
        variant: "destructive",
      });
    }
  };

  const deleteBlockedSlot = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("blocked_time_slots")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBlockedSlots();
      toast({
        title: "Success",
        description: "Blocked time removed",
      });
    } catch (error) {
      console.error("Error deleting blocked slot:", error);
      toast({
        title: "Error",
        description: "Failed to remove blocked time",
        variant: "destructive",
      });
    }
  };

  return {
    blockedSlots,
    isLoading,
    createBlockedSlot,
    updateBlockedSlot,
    deleteBlockedSlot,
    refetch: fetchBlockedSlots,
  };
}
