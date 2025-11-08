import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorldClockTimezone {
  id: string;
  timezone: string;
  city_name: string;
  flag?: string;
  display_order: number;
}

const defaultTimezones = [
  { timezone: "America/New_York", city_name: "New York", flag: "🇺🇸", display_order: 0 },
  { timezone: "Europe/London", city_name: "London", flag: "🇬🇧", display_order: 1 },
  { timezone: "Asia/Bangkok", city_name: "Bangkok", flag: "🇹🇭", display_order: 2 },
  { timezone: "Asia/Tokyo", city_name: "Tokyo", flag: "🇯🇵", display_order: 3 },
  { timezone: "Australia/Sydney", city_name: "Sydney", flag: "🇦🇺", display_order: 4 },
];

export function useWorldClockTimezones() {
  const [timezones, setTimezones] = useState<WorldClockTimezone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimezones();

    // Set up real-time subscription for timezone changes
    const channel = supabase
      .channel('world-clock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_world_clock_timezones',
        },
        (payload) => {
          console.log('World clock change:', payload);
          // Refetch timezones when changes occur
          fetchTimezones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTimezones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTimezones(defaultTimezones.map((tz, idx) => ({ ...tz, id: `default-${idx}` })));
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_world_clock_timezones")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order");

      if (error) throw error;

      if (!data || data.length === 0) {
        // Initialize defaults ONLY on first load, not after user deletions
        // Check if user has ever had timezones before
        const { count } = await supabase
          .from("user_world_clock_timezones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Only insert defaults if user has never had any timezones
        if (count === 0) {
          const defaultsToInsert = defaultTimezones.map(tz => ({
            user_id: user.id,
            timezone: tz.timezone,
            city_name: tz.city_name,
            flag: tz.flag,
            display_order: tz.display_order,
          }));

          const { data: insertedData, error: insertError } = await supabase
            .from("user_world_clock_timezones")
            .insert(defaultsToInsert)
            .select();

          if (insertError) {
            console.error("Error inserting default timezones:", insertError);
            setTimezones([]);
          } else {
            setTimezones(insertedData || []);
          }
        } else {
          // User deleted all their timezones intentionally, show empty state
          setTimezones([]);
        }
      } else {
        setTimezones(data);
      }
    } catch (error) {
      console.error("Error fetching world clock timezones:", error);
      setTimezones(defaultTimezones.map((tz, idx) => ({ ...tz, id: `default-${idx}` })));
    } finally {
      setIsLoading(false);
    }
  };

  const addTimezone = async (timezone: string, cityName: string, flag?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current time offsets for all timezones to sort chronologically
      const now = new Date();
      
      // Calculate offset for the new timezone
      const newTimezoneOffset = getTimezoneOffset(timezone, now);
      
      // Calculate display order based on chronological ordering
      let displayOrder = 0;
      
      if (timezones.length > 0) {
        // Find the position where this timezone should be inserted chronologically
        const timezonesWithOffsets = timezones.map(tz => ({
          ...tz,
          offset: getTimezoneOffset(tz.timezone, now)
        }));
        
        // Find where to insert the new timezone
        const insertIndex = timezonesWithOffsets.findIndex(tz => tz.offset > newTimezoneOffset);
        
        if (insertIndex === -1) {
          // New timezone should be at the end
          displayOrder = Math.max(...timezones.map(tz => tz.display_order)) + 1;
        } else {
          // New timezone should be inserted at insertIndex
          displayOrder = insertIndex;
          
          // Update display order for all timezones at or after this position
          for (let i = insertIndex; i < timezones.length; i++) {
            await supabase
              .from("user_world_clock_timezones")
              .update({ display_order: i + 1 })
              .eq("id", timezones[i].id)
              .eq("user_id", user.id);
          }
        }
      }

      const { data, error } = await supabase
        .from("user_world_clock_timezones")
        .insert({
          user_id: user.id,
          timezone,
          city_name: cityName,
          flag,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately refresh local state so UI updates without a full reload
      await fetchTimezones();

      toast({
        title: "Timezone added",
        description: `${cityName} has been added to your world clock`,
      });
    } catch (error: any) {
      console.error("Error adding timezone:", error);
      if (error.code === '23505') {
        toast({
          title: "Timezone already exists",
          description: "This timezone is already in your world clock",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add timezone",
          variant: "destructive",
        });
      }
    }
  };

  const removeTimezone = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_world_clock_timezones")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Immediately refetch to update UI
      await fetchTimezones();

      toast({
        title: "Timezone removed",
        description: "Timezone has been removed from your world clock",
      });
    } catch (error) {
      console.error("Error removing timezone:", error);
      toast({
        title: "Error",
        description: "Failed to remove timezone",
        variant: "destructive",
      });
    }
  };

  const reorderTimezones = async (reorderedTimezones: WorldClockTimezone[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = reorderedTimezones.map((tz, index) => ({
        id: tz.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("user_world_clock_timezones")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
          .eq("user_id", user.id);
      }

      setTimezones(reorderedTimezones);
    } catch (error) {
      console.error("Error reordering timezones:", error);
      toast({
        title: "Error",
        description: "Failed to reorder timezones",
        variant: "destructive",
      });
    }
  };

  return {
    timezones,
    isLoading,
    addTimezone,
    removeTimezone,
    reorderTimezones,
    refetch: fetchTimezones,
  };
}

// Helper function to get timezone offset in minutes
function getTimezoneOffset(timezone: string, date: Date): number {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - localDate.getTime()) / (1000 * 60);
}
