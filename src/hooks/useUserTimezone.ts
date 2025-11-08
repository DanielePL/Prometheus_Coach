import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUserTimezone() {
  const [preferredTimezone, setPreferredTimezone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserTimezone();
  }, []);

  const fetchUserTimezone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Default to browser timezone
        setPreferredTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setIsLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("preferred_timezone")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching timezone preference:", error);
        setPreferredTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } else {
        setPreferredTimezone(profile?.preferred_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    } catch (error) {
      console.error("Error:", error);
      setPreferredTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserTimezone = async (timezone: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ preferred_timezone: timezone })
        .eq("id", user.id);

      if (error) throw error;

      setPreferredTimezone(timezone);
      toast({
        title: "Timezone updated",
        description: `Your preferred timezone has been set to ${timezone}`,
      });
    } catch (error) {
      console.error("Error updating timezone:", error);
      toast({
        title: "Error",
        description: "Failed to update timezone preference",
        variant: "destructive",
      });
    }
  };

  return {
    preferredTimezone,
    isLoading,
    updateUserTimezone,
  };
}
