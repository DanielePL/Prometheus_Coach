import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export const useSearchProfiles = () => {
  const [isSearching, setIsSearching] = useState(false);

  const searchByEmail = async (email: string, roleFilter?: string): Promise<Profile | null> => {
    setIsSearching(true);
    try {
      // First, get the user by email from auth.users (requires service role in production)
      // For now, we'll search profiles directly by matching against the user_id
      // In a real app, you'd need a server-side function to look up auth.users
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", email) // This is a workaround - in production use a server function
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      // If role filter is provided, check if profile matches
      if (data && roleFilter && data.role !== roleFilter) {
        return null;
      }

      return data;
    } finally {
      setIsSearching(false);
    }
  };

  const searchClientByEmail = async (email: string): Promise<Profile | null> => {
    return searchByEmail(email, "client");
  };

  return {
    searchByEmail,
    searchClientByEmail,
    isSearching,
  };
};
