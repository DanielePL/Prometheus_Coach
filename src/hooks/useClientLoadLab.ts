import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";
import { startOfWeek, subWeeks, format, eachDayOfInterval, subDays } from "date-fns";

/**
 * Load metrics for a single day
 */
export interface DailyLoad {
  date: string;
  volume: number; // Total reps
  tonnage: number; // Total weight * reps (kg)
  sets: number;
  duration: number; // minutes
  rpe: number | null; // Average RPE
}

/**
 * Weekly load aggregation
 */
export interface WeeklyLoad {
  weekStart: string;
  weekNumber: number;
  volume: number;
  tonnage: number;
  sets: number;
  avgDuration: number;
  avgRpe: number | null;
  sessionCount: number;
}

/**
 * ACWR (Acute:Chronic Workload Ratio) data
 */
export interface ACWRData {
  date: string;
  acuteLoad: number; // Last 7 days
  chronicLoad: number; // Last 28 days average per week
  acwr: number; // Acute / Chronic ratio
  zone: "optimal" | "caution" | "danger" | "insufficient";
}

/**
 * Load Lab summary
 */
export interface LoadLabSummary {
  currentWeekTonnage: number;
  previousWeekTonnage: number;
  tonnageChange: number;
  currentWeekVolume: number;
  avgSessionsPerWeek: number;
  currentACWR: number;
  acwrZone: "optimal" | "caution" | "danger" | "insufficient";
  totalTonnageLast30Days: number;
  avgTonnagePerSession: number;
}

/**
 * Muscle group load distribution
 */
export interface MuscleGroupLoad {
  muscleGroup: string;
  tonnage: number;
  volume: number;
  sets: number;
  percentage: number;
}

/**
 * Get ACWR zone based on ratio
 */
const getACWRZone = (acwr: number): "optimal" | "caution" | "danger" | "insufficient" => {
  if (acwr === 0) return "insufficient";
  if (acwr >= 0.8 && acwr <= 1.3) return "optimal";
  if (acwr >= 0.5 && acwr < 0.8) return "caution";
  if (acwr > 1.3 && acwr <= 1.5) return "caution";
  return "danger";
};

/**
 * Fetch all load data for a client
 */
export const useClientLoadLab = (clientId: string, daysBack: number = 56) => {
  return useQuery({
    queryKey: ["client-load-lab", clientId, daysBack],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, daysBack);

      // Get workout sessions with sets
      const { data: sessions, error: sessionsError } = await exerciseLibraryClient
        .from("workout_sessions")
        .select(`
          id,
          user_id,
          started_at,
          completed_at,
          duration_minutes
        `)
        .eq("user_id", clientId)
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: true });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) {
        return {
          dailyLoads: [],
          weeklyLoads: [],
          acwrData: [],
          summary: null,
          muscleGroupLoads: [],
        };
      }

      // Get all sets for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: sets, error: setsError } = await exerciseLibraryClient
        .from("workout_sets")
        .select(`
          id,
          session_id,
          exercise_id,
          reps,
          weight_kg,
          rpe,
          created_at
        `)
        .in("session_id", sessionIds);

      if (setsError) throw setsError;

      // Get exercise info for muscle groups
      const exerciseIds = [...new Set((sets || []).map(s => s.exercise_id))];
      const { data: exercises } = await exerciseLibraryClient
        .from("exercises_new")
        .select("id, main_muscle_group")
        .in("id", exerciseIds);

      const exerciseMap = new Map(
        (exercises || []).map(e => [e.id, e.main_muscle_group])
      );

      // Calculate daily loads
      const dailyLoadMap = new Map<string, DailyLoad>();
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Initialize all days
      dateRange.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        dailyLoadMap.set(dateStr, {
          date: dateStr,
          volume: 0,
          tonnage: 0,
          sets: 0,
          duration: 0,
          rpe: null,
        });
      });

      // Aggregate session data by day
      sessions.forEach(session => {
        const dateStr = format(new Date(session.started_at), "yyyy-MM-dd");
        const sessionSets = (sets || []).filter(s => s.session_id === session.id);
        const existing = dailyLoadMap.get(dateStr)!;

        const sessionVolume = sessionSets.reduce((sum, s) => sum + (s.reps || 0), 0);
        const sessionTonnage = sessionSets.reduce(
          (sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)),
          0
        );
        const sessionRpes = sessionSets.filter(s => s.rpe).map(s => s.rpe!);
        const avgRpe = sessionRpes.length > 0
          ? sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length
          : null;

        existing.volume += sessionVolume;
        existing.tonnage += sessionTonnage;
        existing.sets += sessionSets.length;
        existing.duration += session.duration_minutes || 0;
        if (avgRpe !== null) {
          existing.rpe = existing.rpe ? (existing.rpe + avgRpe) / 2 : avgRpe;
        }
      });

      const dailyLoads = Array.from(dailyLoadMap.values());

      // Calculate weekly loads
      const weeklyLoadMap = new Map<string, WeeklyLoad>();
      dailyLoads.forEach(day => {
        const weekStart = format(startOfWeek(new Date(day.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
        if (!weeklyLoadMap.has(weekStart)) {
          weeklyLoadMap.set(weekStart, {
            weekStart,
            weekNumber: 0,
            volume: 0,
            tonnage: 0,
            sets: 0,
            avgDuration: 0,
            avgRpe: null,
            sessionCount: 0,
          });
        }
        const week = weeklyLoadMap.get(weekStart)!;
        week.volume += day.volume;
        week.tonnage += day.tonnage;
        week.sets += day.sets;
        if (day.duration > 0) {
          week.sessionCount++;
          week.avgDuration += day.duration;
        }
      });

      // Finalize weekly calculations
      const weeklyLoads = Array.from(weeklyLoadMap.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((week, i) => ({
          ...week,
          weekNumber: i + 1,
          avgDuration: week.sessionCount > 0 ? week.avgDuration / week.sessionCount : 0,
        }));

      // Calculate ACWR data (rolling 7-day acute vs 28-day chronic)
      const acwrData: ACWRData[] = [];
      for (let i = 27; i < dailyLoads.length; i++) {
        const currentDate = dailyLoads[i].date;

        // Acute load: sum of last 7 days
        const acuteLoad = dailyLoads
          .slice(i - 6, i + 1)
          .reduce((sum, d) => sum + d.tonnage, 0);

        // Chronic load: average weekly load over 4 weeks
        const chronicDays = dailyLoads.slice(i - 27, i + 1);
        const chronicLoad = chronicDays.reduce((sum, d) => sum + d.tonnage, 0) / 4;

        const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

        acwrData.push({
          date: currentDate,
          acuteLoad,
          chronicLoad,
          acwr: Number(acwr.toFixed(2)),
          zone: getACWRZone(acwr),
        });
      }

      // Calculate muscle group distribution
      const muscleGroupMap = new Map<string, { tonnage: number; volume: number; sets: number }>();
      (sets || []).forEach(set => {
        const muscleGroup = exerciseMap.get(set.exercise_id) || "Other";
        if (!muscleGroupMap.has(muscleGroup)) {
          muscleGroupMap.set(muscleGroup, { tonnage: 0, volume: 0, sets: 0 });
        }
        const mg = muscleGroupMap.get(muscleGroup)!;
        mg.tonnage += (set.weight_kg || 0) * (set.reps || 0);
        mg.volume += set.reps || 0;
        mg.sets++;
      });

      const totalTonnage = Array.from(muscleGroupMap.values())
        .reduce((sum, mg) => sum + mg.tonnage, 0);

      const muscleGroupLoads: MuscleGroupLoad[] = Array.from(muscleGroupMap.entries())
        .map(([muscleGroup, data]) => ({
          muscleGroup,
          ...data,
          percentage: totalTonnage > 0 ? (data.tonnage / totalTonnage) * 100 : 0,
        }))
        .sort((a, b) => b.tonnage - a.tonnage);

      // Calculate summary
      const currentWeek = weeklyLoads[weeklyLoads.length - 1];
      const previousWeek = weeklyLoads[weeklyLoads.length - 2];
      const currentACWR = acwrData.length > 0 ? acwrData[acwrData.length - 1] : null;

      const summary: LoadLabSummary = {
        currentWeekTonnage: currentWeek?.tonnage || 0,
        previousWeekTonnage: previousWeek?.tonnage || 0,
        tonnageChange: currentWeek && previousWeek && previousWeek.tonnage > 0
          ? ((currentWeek.tonnage - previousWeek.tonnage) / previousWeek.tonnage) * 100
          : 0,
        currentWeekVolume: currentWeek?.volume || 0,
        avgSessionsPerWeek: weeklyLoads.length > 0
          ? weeklyLoads.reduce((sum, w) => sum + w.sessionCount, 0) / weeklyLoads.length
          : 0,
        currentACWR: currentACWR?.acwr || 0,
        acwrZone: currentACWR?.zone || "insufficient",
        totalTonnageLast30Days: dailyLoads.slice(-30).reduce((sum, d) => sum + d.tonnage, 0),
        avgTonnagePerSession: sessions.length > 0
          ? dailyLoads.reduce((sum, d) => sum + d.tonnage, 0) / sessions.length
          : 0,
      };

      return {
        dailyLoads,
        weeklyLoads,
        acwrData,
        summary,
        muscleGroupLoads,
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Get exercise-specific load progression
 */
export const useExerciseLoadProgression = (clientId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ["exercise-load-progression", clientId, exerciseId],
    queryFn: async () => {
      const { data, error } = await exerciseLibraryClient
        .from("workout_sets")
        .select(`
          id,
          weight_kg,
          reps,
          rpe,
          created_at,
          workout_sessions!inner(user_id)
        `)
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", clientId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      return (data || []).map(set => ({
        date: set.created_at,
        weight: set.weight_kg,
        reps: set.reps,
        rpe: set.rpe,
        volume: (set.weight_kg || 0) * (set.reps || 0),
        // Estimated 1RM using Epley formula
        estimated1RM: set.weight_kg && set.reps
          ? set.weight_kg * (1 + set.reps / 30)
          : null,
      }));
    },
    enabled: !!clientId && !!exerciseId,
  });
};