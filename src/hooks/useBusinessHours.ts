import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BusinessHours {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useBusinessHours(userId?: string) {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessHours();
  }, [userId]);

  const fetchBusinessHours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", targetUserId)
        .order("day_of_week");

      if (error) throw error;

      setBusinessHours(data || []);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      toast({
        title: "Error",
        description: "Failed to load business hours",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveBusinessHours = async (dayOfWeek: number, startTime: string, endTime: string, isEnabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existing = businessHours.find(bh => bh.day_of_week === dayOfWeek);

      if (existing) {
        const { error } = await supabase
          .from("business_hours")
          .update({ start_time: startTime, end_time: endTime, is_enabled: isEnabled })
          .eq("id", existing.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_hours")
          .insert({
            user_id: user.id,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_enabled: isEnabled,
          });

        if (error) throw error;
      }

      await fetchBusinessHours();
      toast({
        title: "Success",
        description: `Business hours for ${DAYS[dayOfWeek]} updated`,
      });
    } catch (error) {
      console.error("Error saving business hours:", error);
      toast({
        title: "Error",
        description: "Failed to save business hours",
        variant: "destructive",
      });
    }
  };

  const toggleDay = async (dayOfWeek: number, isEnabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existing = businessHours.find(bh => bh.day_of_week === dayOfWeek);
      
      if (existing) {
        const { error } = await supabase
          .from("business_hours")
          .update({ is_enabled: isEnabled })
          .eq("id", existing.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create default hours if doesn't exist
        const { error } = await supabase
          .from("business_hours")
          .insert({
            user_id: user.id,
            day_of_week: dayOfWeek,
            start_time: "09:00:00",
            end_time: "17:00:00",
            is_enabled: isEnabled,
          });

        if (error) throw error;
      }

      await fetchBusinessHours();
    } catch (error) {
      console.error("Error toggling day:", error);
      toast({
        title: "Error",
        description: "Failed to update business hours",
        variant: "destructive",
      });
    }
  };

  return {
    businessHours,
    isLoading,
    saveBusinessHours,
    toggleDay,
    refetch: fetchBusinessHours,
  };
}
