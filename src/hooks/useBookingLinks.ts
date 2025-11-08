import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BookingLink {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useBookingLinks() {
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingLinks();
  }, []);

  const fetchBookingLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("booking_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookingLinks(data || []);
    } catch (error) {
      console.error("Error fetching booking links:", error);
      toast({
        title: "Error",
        description: "Failed to load booking links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBookingLink = async (
    title: string,
    slug: string,
    durationMinutes: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("booking_links").insert({
        user_id: user.id,
        title,
        slug,
        duration_minutes: durationMinutes,
        is_enabled: true,
      });

      if (error) throw error;

      await fetchBookingLinks();
      toast({
        title: "Success",
        description: "Booking link created successfully",
      });
    } catch (error: any) {
      console.error("Error creating booking link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking link",
        variant: "destructive",
      });
    }
  };

  const updateBookingLink = async (
    id: string,
    updates: Partial<Omit<BookingLink, "id" | "user_id" | "created_at" | "updated_at">>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("booking_links")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBookingLinks();
      toast({
        title: "Success",
        description: "Booking link updated",
      });
    } catch (error) {
      console.error("Error updating booking link:", error);
      toast({
        title: "Error",
        description: "Failed to update booking link",
        variant: "destructive",
      });
    }
  };

  const deleteBookingLink = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("booking_links")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchBookingLinks();
      toast({
        title: "Success",
        description: "Booking link deleted",
      });
    } catch (error) {
      console.error("Error deleting booking link:", error);
      toast({
        title: "Error",
        description: "Failed to delete booking link",
        variant: "destructive",
      });
    }
  };

  return {
    bookingLinks,
    isLoading,
    createBookingLink,
    updateBookingLink,
    deleteBookingLink,
    refetch: fetchBookingLinks,
  };
}
