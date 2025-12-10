import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";

// Get today's events for schedule
export function useTodaySchedule() {
  const { user } = useAuth();
  const today = new Date();

  return useQuery({
    queryKey: ["todaySchedule", user?.id, format(today, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user?.id) return [];

      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          start_time,
          end_time,
          event_type,
          color,
          assigned_to,
          profiles:assigned_to(full_name)
        `)
        .eq("created_by", user.id)
        .gte("start_time", dayStart)
        .lte("start_time", dayEnd)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

// Get this week's session count
export function useWeeklySessionCount() {
  const { user } = useAuth();
  const today = new Date();

  return useQuery({
    queryKey: ["weeklySessionCount", user?.id, format(startOfWeek(today), "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user?.id) return 0;

      const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

      // Count events that are client sessions (training type)
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("event_type", "training")
        .gte("start_time", weekStart)
        .lte("start_time", weekEnd);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}

// Get recently viewed/used exercises
export function useRecentExercises(limit = 4) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recentExercises", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      // First try to get exercises from recent workout templates
      const { data: templateExercises, error: templateError } = await supabase
        .from("workout_template_exercises")
        .select(`
          exercise_id,
          exercises(
            id,
            title,
            thumbnail_url,
            category
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      if (templateError) {
        console.error("Error fetching template exercises:", templateError);
      }

      // Get unique exercises
      const uniqueExercises = new Map();
      templateExercises?.forEach((te: any) => {
        if (te.exercises && !uniqueExercises.has(te.exercises.id)) {
          uniqueExercises.set(te.exercises.id, te.exercises);
        }
      });

      // If we have enough from templates, return them
      if (uniqueExercises.size >= limit) {
        return Array.from(uniqueExercises.values()).slice(0, limit);
      }

      // Otherwise, get popular exercises to fill the gap
      const { data: popularExercises, error: popularError } = await supabase
        .from("exercises")
        .select("id, title, thumbnail_url, category")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (popularError) throw popularError;

      // Combine and deduplicate
      popularExercises?.forEach((ex: any) => {
        if (!uniqueExercises.has(ex.id)) {
          uniqueExercises.set(ex.id, ex);
        }
      });

      return Array.from(uniqueExercises.values()).slice(0, limit);
    },
    enabled: !!user?.id,
  });
}
