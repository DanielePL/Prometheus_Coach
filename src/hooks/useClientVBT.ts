import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";

/**
 * VBT Metrics from velocity_metrics JSONB in workout_sets
 */
export interface VelocityMetrics {
  reps_detected: number;
  avg_peak_velocity: number;
  velocity_drop: number;
  unit: string;
  exercise_type: string;
  tracked_landmark: string;
  calibration_tier: string;
  rep_data?: RepData[];
}

export interface RepData {
  rep_number: number;
  peak_velocity: number;
  avg_velocity: number;
  duration_s: number;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  duration_seconds: number | null;
  rpe: number | null;
  rest_seconds: number | null;
  velocity_metrics: VelocityMetrics | null;
  video_url: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_name: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  workout_sets?: WorkoutSet[];
}

export interface VBTSummary {
  totalSets: number;
  totalReps: number;
  avgVelocity: number;
  avgPeakVelocity: number;
  avgVelocityLoss: number;
  totalVolume: number; // kg * reps
  totalTonnage: number; // total weight lifted
  setsWithVBT: number;
}

export interface ExerciseVBTStats {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  avgVelocity: number;
  avgPeakVelocity: number;
  avgWeight: number;
  estimated1RM: number | null;
  lastPerformed: string;
}

/**
 * Fetch all workout sessions with VBT data for a client
 */
export const useClientVBT = (clientId: string) => {
  return useQuery({
    queryKey: ["client-vbt", clientId],
    queryFn: async () => {
      // Get workout sessions for this client
      const { data: sessions, error: sessionsError } = await exerciseLibraryClient
        .from("workout_sessions")
        .select(`
          id,
          user_id,
          workout_name,
          started_at,
          completed_at,
          duration_minutes,
          notes
        `)
        .eq("user_id", clientId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return { sessions: [], summary: null, exerciseStats: [] };

      // Get all sets for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: sets, error: setsError } = await exerciseLibraryClient
        .from("workout_sets")
        .select("*")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true });

      if (setsError) throw setsError;

      // Attach sets to sessions
      const sessionsWithSets = sessions.map(session => ({
        ...session,
        workout_sets: (sets || []).filter(s => s.session_id === session.id)
      }));

      // Calculate VBT summary
      const allSets = sets || [];
      const setsWithVBT = allSets.filter(s => s.velocity_metrics);

      const summary: VBTSummary = {
        totalSets: allSets.length,
        totalReps: allSets.reduce((sum, s) => sum + (s.reps || 0), 0),
        avgVelocity: setsWithVBT.length > 0
          ? setsWithVBT.reduce((sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0) / setsWithVBT.length
          : 0,
        avgPeakVelocity: setsWithVBT.length > 0
          ? setsWithVBT.reduce((sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0) / setsWithVBT.length
          : 0,
        avgVelocityLoss: setsWithVBT.length > 0
          ? setsWithVBT.reduce((sum, s) => sum + (s.velocity_metrics?.velocity_drop || 0), 0) / setsWithVBT.length
          : 0,
        totalVolume: allSets.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0),
        totalTonnage: allSets.reduce((sum, s) => sum + (s.weight_kg || 0), 0),
        setsWithVBT: setsWithVBT.length
      };

      // Calculate per-exercise stats
      const exerciseMap = new Map<string, { sets: WorkoutSet[], name: string }>();
      for (const set of allSets) {
        if (!exerciseMap.has(set.exercise_id)) {
          exerciseMap.set(set.exercise_id, { sets: [], name: set.exercise_id });
        }
        exerciseMap.get(set.exercise_id)!.sets.push(set);
      }

      const exerciseStats: ExerciseVBTStats[] = Array.from(exerciseMap.entries()).map(([exerciseId, data]) => {
        const vbtSets = data.sets.filter(s => s.velocity_metrics);
        const avgWeight = data.sets.reduce((sum, s) => sum + (s.weight_kg || 0), 0) / data.sets.length;

        // Estimate 1RM using Epley formula: weight * (1 + reps/30)
        const heaviestSet = data.sets.reduce((max, s) =>
          (s.weight_kg || 0) > (max.weight_kg || 0) ? s : max, data.sets[0]);
        const estimated1RM = heaviestSet
          ? (heaviestSet.weight_kg || 0) * (1 + (heaviestSet.reps || 0) / 30)
          : null;

        return {
          exerciseId,
          exerciseName: data.name,
          sets: data.sets.length,
          avgVelocity: vbtSets.length > 0
            ? vbtSets.reduce((sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0) / vbtSets.length
            : 0,
          avgPeakVelocity: vbtSets.length > 0
            ? vbtSets.reduce((sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0) / vbtSets.length
            : 0,
          avgWeight,
          estimated1RM,
          lastPerformed: data.sets[data.sets.length - 1]?.created_at || ''
        };
      });

      return {
        sessions: sessionsWithSets as WorkoutSession[],
        summary,
        exerciseStats: exerciseStats.sort((a, b) => b.sets - a.sets)
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Get velocity trend over time for a specific exercise
 */
export const useExerciseVelocityTrend = (clientId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ["exercise-velocity-trend", clientId, exerciseId],
    queryFn: async () => {
      const { data, error } = await exerciseLibraryClient
        .from("workout_sets")
        .select(`
          id,
          weight_kg,
          reps,
          velocity_metrics,
          created_at,
          workout_sessions!inner(user_id)
        `)
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", clientId)
        .not("velocity_metrics", "is", null)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      return (data || []).map(set => ({
        date: set.created_at,
        weight: set.weight_kg,
        reps: set.reps,
        velocity: (set.velocity_metrics as VelocityMetrics)?.avg_peak_velocity || 0,
        velocityLoss: (set.velocity_metrics as VelocityMetrics)?.velocity_drop || 0
      }));
    },
    enabled: !!clientId && !!exerciseId,
  });
};