import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfWeek, eachDayOfInterval } from "date-fns";

/**
 * Client engagement data
 */
export interface ClientEngagement {
  clientId: string;
  clientName: string;
  workoutsCompleted: number;
  avgWorkoutsPerWeek: number;
  lastWorkoutDate: string | null;
  totalSets: number;
  totalVolume: number;
  mealsLogged: number;
  avgCalories: number;
  daysActive: number;
  engagementScore: number; // 0-100
}

/**
 * Daily activity across all clients
 */
export interface DailyActivity {
  date: string;
  workouts: number;
  sets: number;
  mealsLogged: number;
  activeClients: number;
}

/**
 * Weekly summary
 */
export interface WeeklySummary {
  weekStart: string;
  totalWorkouts: number;
  totalSets: number;
  avgWorkoutsPerClient: number;
  activeClientCount: number;
  nutritionAdherence: number; // percentage
}

/**
 * Trends summary
 */
export interface TrendsSummary {
  totalActiveClients: number;
  avgWorkoutsThisWeek: number;
  avgWorkoutsLastWeek: number;
  workoutTrend: number; // percentage change
  totalSetsThisWeek: number;
  totalMealsLoggedThisWeek: number;
  mostActiveClient: { name: string; workouts: number } | null;
  clientsNeedingAttention: number;
}

/**
 * Fetch trends data for a coach
 */
export const useCoachTrends = (coachId: string, daysBack: number = 30) => {
  return useQuery({
    queryKey: ["coach-trends", coachId, daysBack],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, daysBack);

      // Get connected clients
      const { data: connections, error: connError } = await supabase
        .from("coach_connections")
        .select("client_id, profiles!coach_connections_client_id_fkey(id, full_name)")
        .eq("coach_id", coachId)
        .eq("status", "accepted");

      if (connError) throw connError;

      const clients = (connections || []).map((c: any) => ({
        id: c.client_id,
        name: c.profiles?.full_name || "Unknown",
      }));

      if (clients.length === 0) {
        return {
          clientEngagements: [],
          dailyActivity: [],
          weeklySummaries: [],
          summary: null,
        };
      }

      const clientIds = clients.map((c) => c.id);

      // Get workout sessions for all clients
      const { data: sessions, error: sessionsError } = await exerciseLibraryClient
        .from("workout_sessions")
        .select("id, user_id, started_at, completed_at, duration_minutes")
        .in("user_id", clientIds)
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: true });

      if (sessionsError) throw sessionsError;

      // Get sets for these sessions
      const sessionIds = (sessions || []).map((s) => s.id);
      let sets: any[] = [];
      if (sessionIds.length > 0) {
        const { data: setsData, error: setsError } = await exerciseLibraryClient
          .from("workout_sets")
          .select("id, session_id, reps, weight_kg")
          .in("session_id", sessionIds);
        if (setsError) throw setsError;
        sets = setsData || [];
      }

      // Get nutrition logs for all clients
      const { data: nutritionLogs, error: nutritionError } = await exerciseLibraryClient
        .from("nutrition_logs")
        .select("id, user_id, date")
        .in("user_id", clientIds)
        .gte("date", format(startDate, "yyyy-MM-dd"));

      if (nutritionError) throw nutritionError;

      // Get meals count
      const logIds = (nutritionLogs || []).map((l) => l.id);
      let meals: any[] = [];
      if (logIds.length > 0) {
        const { data: mealsData } = await exerciseLibraryClient
          .from("meals")
          .select("id, nutrition_log_id")
          .in("nutrition_log_id", logIds);
        meals = mealsData || [];
      }

      // Calculate per-client engagement
      const clientEngagements: ClientEngagement[] = clients.map((client) => {
        const clientSessions = (sessions || []).filter(
          (s) => s.user_id === client.id
        );
        const clientSessionIds = clientSessions.map((s) => s.id);
        const clientSets = sets.filter((s) =>
          clientSessionIds.includes(s.session_id)
        );
        const clientLogs = (nutritionLogs || []).filter(
          (l) => l.user_id === client.id
        );
        const clientMeals = meals.filter((m) =>
          clientLogs.map((l) => l.id).includes(m.nutrition_log_id)
        );

        const totalVolume = clientSets.reduce(
          (sum, s) => sum + (s.weight_kg || 0) * (s.reps || 0),
          0
        );

        const uniqueDays = new Set(
          clientSessions.map((s) => format(new Date(s.started_at), "yyyy-MM-dd"))
        );

        // Calculate engagement score (0-100)
        const workoutScore = Math.min((clientSessions.length / (daysBack / 7) / 3) * 50, 50);
        const nutritionScore = Math.min((clientLogs.length / daysBack) * 50, 50);
        const engagementScore = Math.round(workoutScore + nutritionScore);

        return {
          clientId: client.id,
          clientName: client.name,
          workoutsCompleted: clientSessions.length,
          avgWorkoutsPerWeek:
            daysBack >= 7 ? clientSessions.length / (daysBack / 7) : clientSessions.length,
          lastWorkoutDate:
            clientSessions.length > 0
              ? clientSessions[clientSessions.length - 1].started_at
              : null,
          totalSets: clientSets.length,
          totalVolume,
          mealsLogged: clientMeals.length,
          avgCalories: 0, // Would need meal_items for accurate calc
          daysActive: uniqueDays.size,
          engagementScore,
        };
      });

      // Sort by engagement score
      clientEngagements.sort((a, b) => b.engagementScore - a.engagementScore);

      // Calculate daily activity
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyActivity: DailyActivity[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const daySessions = (sessions || []).filter(
          (s) => format(new Date(s.started_at), "yyyy-MM-dd") === dateStr
        );
        const daySessionIds = daySessions.map((s) => s.id);
        const daySets = sets.filter((s) => daySessionIds.includes(s.session_id));
        const dayLogs = (nutritionLogs || []).filter((l) => l.date === dateStr);
        const dayMeals = meals.filter((m) =>
          dayLogs.map((l) => l.id).includes(m.nutrition_log_id)
        );

        return {
          date: dateStr,
          workouts: daySessions.length,
          sets: daySets.length,
          mealsLogged: dayMeals.length,
          activeClients: new Set(daySessions.map((s) => s.user_id)).size,
        };
      });

      // Calculate weekly summaries
      const weeklySummaries: WeeklySummary[] = [];
      for (let i = 0; i < Math.ceil(daysBack / 7); i++) {
        const weekEnd = subDays(endDate, i * 7);
        const weekStart = startOfWeek(weekEnd, { weekStartsOn: 1 });
        const weekStartStr = format(weekStart, "yyyy-MM-dd");

        const weekActivity = dailyActivity.filter((d) => {
          const dDate = new Date(d.date);
          return dDate >= weekStart && dDate <= weekEnd;
        });

        const totalWorkouts = weekActivity.reduce((sum, d) => sum + d.workouts, 0);
        const totalSets = weekActivity.reduce((sum, d) => sum + d.sets, 0);
        const activeClientsSet = new Set<string>();
        (sessions || [])
          .filter((s) => {
            const sDate = new Date(s.started_at);
            return sDate >= weekStart && sDate <= weekEnd;
          })
          .forEach((s) => activeClientsSet.add(s.user_id));

        weeklySummaries.push({
          weekStart: weekStartStr,
          totalWorkouts,
          totalSets,
          avgWorkoutsPerClient:
            activeClientsSet.size > 0 ? totalWorkouts / activeClientsSet.size : 0,
          activeClientCount: activeClientsSet.size,
          nutritionAdherence: 0, // Would need more data
        });
      }

      weeklySummaries.reverse();

      // Calculate summary
      const thisWeekActivity = dailyActivity.slice(-7);
      const lastWeekActivity = dailyActivity.slice(-14, -7);

      const thisWeekWorkouts = thisWeekActivity.reduce((sum, d) => sum + d.workouts, 0);
      const lastWeekWorkouts = lastWeekActivity.reduce((sum, d) => sum + d.workouts, 0);
      const workoutTrend =
        lastWeekWorkouts > 0
          ? ((thisWeekWorkouts - lastWeekWorkouts) / lastWeekWorkouts) * 100
          : 0;

      const mostActive = clientEngagements[0];
      const clientsNeedingAttention = clientEngagements.filter(
        (c) => c.engagementScore < 30
      ).length;

      const summary: TrendsSummary = {
        totalActiveClients: clientEngagements.filter((c) => c.daysActive > 0).length,
        avgWorkoutsThisWeek: thisWeekWorkouts / Math.max(clients.length, 1),
        avgWorkoutsLastWeek: lastWeekWorkouts / Math.max(clients.length, 1),
        workoutTrend,
        totalSetsThisWeek: thisWeekActivity.reduce((sum, d) => sum + d.sets, 0),
        totalMealsLoggedThisWeek: thisWeekActivity.reduce(
          (sum, d) => sum + d.mealsLogged,
          0
        ),
        mostActiveClient: mostActive
          ? { name: mostActive.clientName, workouts: mostActive.workoutsCompleted }
          : null,
        clientsNeedingAttention,
      };

      return {
        clientEngagements,
        dailyActivity,
        weeklySummaries,
        summary,
      };
    },
    enabled: !!coachId,
  });
};