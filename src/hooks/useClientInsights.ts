import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";
import { subDays, differenceInDays, format } from "date-fns";

/**
 * Insight types
 */
export type InsightType =
  | "strength_gain"
  | "consistency"
  | "recovery"
  | "nutrition"
  | "volume"
  | "velocity"
  | "recommendation"
  | "warning"
  | "celebration";

export type InsightPriority = "high" | "medium" | "low";

/**
 * Single insight
 */
export interface ClientInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  metric?: string;
  trend?: "up" | "down" | "stable";
  actionable?: string;
  relatedExercise?: string;
}

/**
 * Insights summary
 */
export interface InsightsSummary {
  overallScore: number; // 0-100
  strengths: string[];
  areasToImprove: string[];
  topInsight: ClientInsight | null;
}

/**
 * Generate insights based on client data
 */
export const useClientInsights = (clientId: string) => {
  return useQuery({
    queryKey: ["client-insights", clientId],
    queryFn: async () => {
      const insights: ClientInsight[] = [];
      const now = new Date();
      const fourWeeksAgo = subDays(now, 28);
      const twoWeeksAgo = subDays(now, 14);

      // Fetch workout data
      const { data: sessions } = await exerciseLibraryClient
        .from("workout_sessions")
        .select("id, started_at, completed_at, duration_minutes")
        .eq("user_id", clientId)
        .gte("started_at", fourWeeksAgo.toISOString())
        .order("started_at", { ascending: true });

      const sessionIds = (sessions || []).map(s => s.id);

      // Get sets data
      let sets: any[] = [];
      if (sessionIds.length > 0) {
        const { data: setsData } = await exerciseLibraryClient
          .from("workout_sets")
          .select("id, session_id, weight_kg, reps, rpe, velocity_metrics, created_at")
          .in("session_id", sessionIds);
        sets = setsData || [];
      }

      // Fetch nutrition data
      const { data: nutritionLogs } = await exerciseLibraryClient
        .from("nutrition_logs")
        .select("id, date, target_calories")
        .eq("user_id", clientId)
        .gte("date", format(fourWeeksAgo, "yyyy-MM-dd"));

      const logIds = (nutritionLogs || []).map(l => l.id);
      let meals: any[] = [];
      let mealItems: any[] = [];
      if (logIds.length > 0) {
        const { data: mealsData } = await exerciseLibraryClient
          .from("meals")
          .select("id, nutrition_log_id")
          .in("nutrition_log_id", logIds);
        meals = mealsData || [];

        const mealIds = (meals || []).map(m => m.id);
        if (mealIds.length > 0) {
          const { data: itemsData } = await exerciseLibraryClient
            .from("meal_items")
            .select("id, meal_id, calories, protein")
            .in("meal_id", mealIds);
          mealItems = itemsData || [];
        }
      }

      // ============ ANALYZE WORKOUT CONSISTENCY ============
      const recentSessions = (sessions || []).filter(
        s => new Date(s.started_at) >= twoWeeksAgo
      );
      const olderSessions = (sessions || []).filter(
        s => new Date(s.started_at) < twoWeeksAgo
      );

      const recentWeeklyAvg = recentSessions.length / 2;
      const olderWeeklyAvg = olderSessions.length / 2;

      if (recentSessions.length >= 6) {
        insights.push({
          id: "consistency-high",
          type: "consistency",
          priority: "medium",
          title: "Excellent Workout Consistency",
          description: `Training ${recentWeeklyAvg.toFixed(1)} times per week. Keep up the great work!`,
          metric: `${recentSessions.length} sessions in 2 weeks`,
          trend: "up",
        });
      } else if (recentSessions.length < 2 && olderSessions.length >= 4) {
        insights.push({
          id: "consistency-dropping",
          type: "warning",
          priority: "high",
          title: "Training Frequency Dropping",
          description: "Workout frequency has decreased significantly in the last 2 weeks.",
          metric: `${recentSessions.length} vs ${olderSessions.length} sessions`,
          trend: "down",
          actionable: "Consider scheduling specific workout times to maintain consistency.",
        });
      } else if (recentSessions.length === 0 && (sessions || []).length > 0) {
        const lastSession = sessions![sessions!.length - 1];
        const daysSinceLast = differenceInDays(now, new Date(lastSession.started_at));
        insights.push({
          id: "no-recent-training",
          type: "warning",
          priority: "high",
          title: "No Recent Training",
          description: `It's been ${daysSinceLast} days since the last workout.`,
          actionable: "Reach out to check in and help get back on track.",
        });
      }

      // ============ ANALYZE VOLUME PROGRESSION ============
      const recentVolume = sets
        .filter(s => sessionIds.indexOf(s.session_id) >= olderSessions.length)
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);
      const olderVolume = sets
        .filter(s => sessionIds.indexOf(s.session_id) < olderSessions.length)
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);

      if (olderVolume > 0 && recentVolume > olderVolume * 1.1) {
        insights.push({
          id: "volume-increase",
          type: "volume",
          priority: "medium",
          title: "Training Volume Increasing",
          description: "Total volume has increased by more than 10% compared to previous weeks.",
          metric: `+${Math.round(((recentVolume - olderVolume) / olderVolume) * 100)}%`,
          trend: "up",
        });
      } else if (olderVolume > 0 && recentVolume < olderVolume * 0.7) {
        insights.push({
          id: "volume-decrease",
          type: "warning",
          priority: "medium",
          title: "Training Volume Decreased",
          description: "Volume has dropped significantly. Consider if this is intentional (deload) or needs addressing.",
          metric: `${Math.round(((olderVolume - recentVolume) / olderVolume) * 100)}% decrease`,
          trend: "down",
          actionable: "Review if a deload was planned or if adjustments are needed.",
        });
      }

      // ============ ANALYZE VBT DATA ============
      const vbtSets = sets.filter(s => s.velocity_metrics);
      if (vbtSets.length >= 5) {
        const avgVelocityLoss = vbtSets.reduce(
          (sum, s) => sum + (s.velocity_metrics?.velocity_drop || 0),
          0
        ) / vbtSets.length;

        if (avgVelocityLoss > 25) {
          insights.push({
            id: "velocity-fatigue",
            type: "recovery",
            priority: "high",
            title: "High Fatigue Detected",
            description: `Average velocity loss of ${avgVelocityLoss.toFixed(0)}% indicates high fatigue accumulation.`,
            metric: `${avgVelocityLoss.toFixed(0)}% avg velocity loss`,
            trend: "down",
            actionable: "Consider reducing volume or intensity, or adding more rest.",
          });
        } else if (avgVelocityLoss < 15) {
          insights.push({
            id: "velocity-optimal",
            type: "velocity",
            priority: "low",
            title: "Optimal Training Intensity",
            description: "Velocity loss is within the optimal range for strength gains.",
            metric: `${avgVelocityLoss.toFixed(0)}% avg velocity loss`,
            trend: "stable",
          });
        }
      }

      // ============ ANALYZE RPE ============
      const rpeSets = sets.filter(s => s.rpe);
      if (rpeSets.length >= 10) {
        const avgRpe = rpeSets.reduce((sum, s) => sum + s.rpe, 0) / rpeSets.length;

        if (avgRpe >= 9) {
          insights.push({
            id: "rpe-high",
            type: "recovery",
            priority: "high",
            title: "Training at Maximum Effort",
            description: "Average RPE is very high. Consider periodization to prevent burnout.",
            metric: `Avg RPE: ${avgRpe.toFixed(1)}`,
            actionable: "Plan deload weeks or vary intensity throughout the week.",
          });
        } else if (avgRpe < 6 && olderVolume > 0) {
          insights.push({
            id: "rpe-low",
            type: "recommendation",
            priority: "medium",
            title: "Room to Push Harder",
            description: "Average RPE suggests there's capacity for more challenging workouts.",
            metric: `Avg RPE: ${avgRpe.toFixed(1)}`,
            actionable: "Consider progressive overload - increase weight or reps.",
          });
        }
      }

      // ============ ANALYZE NUTRITION ============
      if (nutritionLogs && nutritionLogs.length >= 7) {
        const daysWithLogs = nutritionLogs.length;
        const expectedDays = 28;
        const adherence = (daysWithLogs / expectedDays) * 100;

        if (adherence >= 80) {
          insights.push({
            id: "nutrition-consistent",
            type: "nutrition",
            priority: "low",
            title: "Strong Nutrition Tracking",
            description: `${Math.round(adherence)}% logging adherence shows excellent commitment.`,
            metric: `${daysWithLogs}/${expectedDays} days logged`,
            trend: "up",
          });
        } else if (adherence < 50) {
          insights.push({
            id: "nutrition-inconsistent",
            type: "warning",
            priority: "medium",
            title: "Nutrition Logging Needs Attention",
            description: "Inconsistent nutrition tracking makes it harder to optimize results.",
            metric: `Only ${Math.round(adherence)}% days logged`,
            actionable: "Encourage daily meal logging, even if estimates.",
          });
        }

        // Check protein intake if we have data
        const totalProtein = mealItems.reduce((sum, i) => sum + (i.protein || 0), 0);
        const avgDailyProtein = totalProtein / Math.max(daysWithLogs, 1);

        if (avgDailyProtein > 0 && avgDailyProtein < 100) {
          insights.push({
            id: "protein-low",
            type: "nutrition",
            priority: "high",
            title: "Protein Intake May Be Low",
            description: "Average daily protein might be insufficient for optimal muscle growth.",
            metric: `~${Math.round(avgDailyProtein)}g/day`,
            actionable: "Aim for 1.6-2.2g protein per kg body weight.",
          });
        }
      } else if (!nutritionLogs || nutritionLogs.length === 0) {
        insights.push({
          id: "no-nutrition-tracking",
          type: "recommendation",
          priority: "medium",
          title: "No Nutrition Tracking",
          description: "Nutrition data would help provide better insights for optimization.",
          actionable: "Encourage the client to start logging meals.",
        });
      }

      // ============ CELEBRATION INSIGHTS ============
      if ((sessions || []).length >= 12) {
        insights.push({
          id: "milestone-sessions",
          type: "celebration",
          priority: "low",
          title: "Training Milestone!",
          description: `${(sessions || []).length} workouts completed in the last month!`,
        });
      }

      // Sort insights by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      // Calculate overall score
      let score = 50; // Base score

      // Adjust based on insights
      insights.forEach(insight => {
        if (insight.type === "celebration" || insight.trend === "up") score += 10;
        if (insight.type === "warning") score -= 15;
        if (insight.priority === "high" && insight.type === "warning") score -= 10;
      });

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      // Identify strengths and areas to improve
      const strengths = insights
        .filter(i => i.type === "celebration" || i.trend === "up" || i.type === "consistency")
        .map(i => i.title)
        .slice(0, 3);

      const areasToImprove = insights
        .filter(i => i.type === "warning" || i.type === "recommendation")
        .map(i => i.title)
        .slice(0, 3);

      const summary: InsightsSummary = {
        overallScore: score,
        strengths,
        areasToImprove,
        topInsight: insights[0] || null,
      };

      return {
        insights,
        summary,
        lastUpdated: now.toISOString(),
      };
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
