import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";

/**
 * Enhanced PR with exercise info and estimated 1RM
 */
export interface EnhancedPR {
  id: string;
  clientId: string;
  clientName: string;
  exerciseId: string;
  exerciseName: string;
  weightUsed: number;
  repsCompleted: number;
  achievedAt: string;
  estimated1RM: number;
  muscleGroup: string | null;
}

/**
 * PR Leaderboard entry
 */
export interface LeaderboardEntry {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  topPRs: {
    clientId: string;
    clientName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
    achievedAt: string;
  }[];
}

/**
 * PR Timeline entry
 */
export interface PRTimelineEntry {
  id: string;
  exerciseName: string;
  clientName: string;
  weight: number;
  reps: number;
  achievedAt: string;
  estimated1RM: number;
  isRecent: boolean;
}

/**
 * Calculate estimated 1RM using Epley formula
 */
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

/**
 * Fetch enhanced PR data for a single client
 */
export const useClientEnhancedPRs = (clientId: string) => {
  return useQuery({
    queryKey: ["enhanced-prs", clientId],
    queryFn: async () => {
      // Get PRs from Coach app's Supabase
      const { data: prs, error: prsError } = await supabase
        .from("personal_records")
        .select(`
          id,
          client_id,
          exercise_id,
          weight_used,
          reps_completed,
          achieved_at
        `)
        .eq("client_id", clientId)
        .order("achieved_at", { ascending: false });

      if (prsError) throw prsError;
      if (!prs || prs.length === 0) return { prs: [], byExercise: new Map() };

      // Get exercise info from Prometheus library
      const exerciseIds = [...new Set(prs.map(pr => pr.exercise_id))];
      const { data: exercises } = await exerciseLibraryClient
        .from("exercises_new")
        .select("id, name, main_muscle_group")
        .in("id", exerciseIds);

      const exerciseMap = new Map(
        (exercises || []).map(e => [e.id, { name: e.name, muscleGroup: e.main_muscle_group }])
      );

      // Map PRs with exercise info
      const enhancedPRs: EnhancedPR[] = prs.map(pr => {
        const exercise = exerciseMap.get(pr.exercise_id);
        return {
          id: pr.id,
          clientId: pr.client_id,
          clientName: "", // Not needed for single client view
          exerciseId: pr.exercise_id,
          exerciseName: exercise?.name || pr.exercise_id,
          weightUsed: pr.weight_used,
          repsCompleted: pr.reps_completed,
          achievedAt: pr.achieved_at,
          estimated1RM: calculate1RM(pr.weight_used, pr.reps_completed),
          muscleGroup: exercise?.muscleGroup || null,
        };
      });

      // Group by exercise for easy access
      const byExercise = new Map<string, EnhancedPR[]>();
      enhancedPRs.forEach(pr => {
        if (!byExercise.has(pr.exerciseId)) {
          byExercise.set(pr.exerciseId, []);
        }
        byExercise.get(pr.exerciseId)!.push(pr);
      });

      return {
        prs: enhancedPRs,
        byExercise,
        // Summary stats
        totalPRs: enhancedPRs.length,
        highestEstimated1RM: enhancedPRs.length > 0
          ? Math.max(...enhancedPRs.map(pr => pr.estimated1RM))
          : 0,
        mostRecentPR: enhancedPRs[0] || null,
        prsByMuscleGroup: Array.from(
          enhancedPRs.reduce((acc, pr) => {
            const mg = pr.muscleGroup || "Other";
            acc.set(mg, (acc.get(mg) || 0) + 1);
            return acc;
          }, new Map<string, number>())
        ),
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Fetch PR leaderboard across all connected clients (for coaches)
 */
export const usePRLeaderboard = (coachId: string) => {
  return useQuery({
    queryKey: ["pr-leaderboard", coachId],
    queryFn: async () => {
      // Get connected clients
      const { data: connections, error: connError } = await supabase
        .from("coach_connections")
        .select("client_id, profiles!coach_connections_client_id_fkey(id, full_name)")
        .eq("coach_id", coachId)
        .eq("status", "accepted");

      if (connError) throw connError;
      if (!connections || connections.length === 0) return { leaderboard: [], timeline: [] };

      const clientMap = new Map(
        connections.map((c: any) => [c.client_id, c.profiles?.full_name || "Unknown"])
      );
      const clientIds = connections.map((c: any) => c.client_id);

      // Get all PRs for connected clients
      const { data: prs, error: prsError } = await supabase
        .from("personal_records")
        .select("*")
        .in("client_id", clientIds)
        .order("achieved_at", { ascending: false });

      if (prsError) throw prsError;
      if (!prs || prs.length === 0) return { leaderboard: [], timeline: [] };

      // Get exercise info
      const exerciseIds = [...new Set(prs.map(pr => pr.exercise_id))];
      const { data: exercises } = await exerciseLibraryClient
        .from("exercises_new")
        .select("id, name, main_muscle_group")
        .in("id", exerciseIds);

      const exerciseMap = new Map(
        (exercises || []).map(e => [e.id, { name: e.name, muscleGroup: e.main_muscle_group }])
      );

      // Build leaderboard by exercise
      const exercisePRs = new Map<string, any[]>();
      prs.forEach(pr => {
        if (!exercisePRs.has(pr.exercise_id)) {
          exercisePRs.set(pr.exercise_id, []);
        }
        exercisePRs.get(pr.exercise_id)!.push({
          clientId: pr.client_id,
          clientName: clientMap.get(pr.client_id) || "Unknown",
          weight: pr.weight_used,
          reps: pr.reps_completed,
          estimated1RM: calculate1RM(pr.weight_used, pr.reps_completed),
          achievedAt: pr.achieved_at,
        });
      });

      // Sort each exercise's PRs by estimated 1RM and take top 5
      const leaderboard: LeaderboardEntry[] = Array.from(exercisePRs.entries())
        .map(([exerciseId, clientPRs]) => {
          const exercise = exerciseMap.get(exerciseId);
          // Sort by estimated 1RM descending
          const sorted = clientPRs.sort((a, b) => b.estimated1RM - a.estimated1RM);
          return {
            exerciseId,
            exerciseName: exercise?.name || exerciseId,
            muscleGroup: exercise?.muscleGroup || null,
            topPRs: sorted.slice(0, 5),
          };
        })
        // Sort exercises by highest 1RM
        .sort((a, b) => (b.topPRs[0]?.estimated1RM || 0) - (a.topPRs[0]?.estimated1RM || 0));

      // Build timeline (most recent PRs)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const timeline: PRTimelineEntry[] = prs.slice(0, 20).map(pr => {
        const exercise = exerciseMap.get(pr.exercise_id);
        const achievedDate = new Date(pr.achieved_at);
        return {
          id: pr.id,
          exerciseName: exercise?.name || pr.exercise_id,
          clientName: clientMap.get(pr.client_id) || "Unknown",
          weight: pr.weight_used,
          reps: pr.reps_completed,
          achievedAt: pr.achieved_at,
          estimated1RM: calculate1RM(pr.weight_used, pr.reps_completed),
          isRecent: achievedDate >= oneWeekAgo,
        };
      });

      return {
        leaderboard,
        timeline,
        totalClients: clientIds.length,
        totalPRs: prs.length,
        prsThisWeek: prs.filter(pr => new Date(pr.achieved_at) >= oneWeekAgo).length,
      };
    },
    enabled: !!coachId,
  });
};

/**
 * Fetch PR history for a specific exercise across time
 */
export const useExercisePRHistory = (clientId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ["exercise-pr-history", clientId, exerciseId],
    queryFn: async () => {
      // This would need a pr_history table to track all attempts, not just current best
      // For now, we'll use workout_sets to show progression
      const { data: sets, error } = await exerciseLibraryClient
        .from("workout_sets")
        .select(`
          id,
          weight_kg,
          reps,
          created_at,
          workout_sessions!inner(user_id)
        `)
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", clientId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Track progressive maxes over time
      let maxEstimated1RM = 0;
      const progressionData = (sets || []).map(set => {
        const estimated1RM = calculate1RM(set.weight_kg || 0, set.reps || 0);
        const isNewMax = estimated1RM > maxEstimated1RM;
        if (isNewMax) maxEstimated1RM = estimated1RM;

        return {
          date: set.created_at,
          weight: set.weight_kg,
          reps: set.reps,
          estimated1RM,
          isNewMax,
        };
      });

      return progressionData;
    },
    enabled: !!clientId && !!exerciseId,
  });
};
