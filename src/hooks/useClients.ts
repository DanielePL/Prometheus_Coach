import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useClients = () => {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "client")
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  return {
    clients,
    isLoading,
  };
};
