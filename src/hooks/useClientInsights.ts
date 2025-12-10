import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, differenceInDays, format, startOfWeek, getDay, parseISO } from "date-fns";

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
  | "celebration"
  | "pr"
  | "pattern"
  | "goal";

export type InsightPriority = "high" | "medium" | "low";
export type InsightCategory = "training" | "nutrition" | "recovery" | "progress" | "behavior";

/**
 * Single insight
 */
export interface ClientInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  metric?: string;
  trend?: "up" | "down" | "stable";
  actionable?: string;
  relatedExercise?: string;
  data?: Record<string, any>;
}

/**
 * Weekly breakdown for trends
 */
export interface WeeklyStats {
  weekStart: string;
  sessions: number;
  volume: number;
  avgRpe: number | null;
  prs: number;
}

/**
 * Training patterns
 */
export interface TrainingPattern {
  preferredDays: string[];
  avgSessionDuration: number;
  avgRestDays: number;
  mostTrainedMuscles: { muscle: string; sessions: number }[];
  peakTrainingTime: string;
}

/**
 * Insights summary
 */
export interface InsightsSummary {
  overallScore: number; // 0-100
  trainingScore: number;
  nutritionScore: number;
  consistencyScore: number;
  progressScore: number;
  strengths: string[];
  areasToImprove: string[];
  topInsight: ClientInsight | null;
  weeklyTrend: WeeklyStats[];
  trainingPattern: TrainingPattern | null;
  quickStats: {
    totalWorkouts: number;
    avgPerWeek: number;
    totalVolume: number;
    prsThisMonth: number;
    currentStreak: number;
    longestStreak: number;
  };
}

/**
 * Generate comprehensive insights based on client data
 */
export const useClientInsights = (clientId: string) => {
  return useQuery({
    queryKey: ["client-insights", clientId],
    queryFn: async () => {
      const insights: ClientInsight[] = [];
      const now = new Date();
      const fourWeeksAgo = subDays(now, 28);
      const twoWeeksAgo = subDays(now, 14);
      const oneWeekAgo = subDays(now, 7);
      const eightWeeksAgo = subDays(now, 56);

      // ============ FETCH ALL DATA ============

      // Fetch workout sessions (extended timeframe)
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, started_at, completed_at, duration_minutes, status, routine_id")
        .eq("user_id", clientId)
        .gte("started_at", eightWeeksAgo.toISOString())
        .order("started_at", { ascending: true });

      const completedSessions = (sessions || []).filter(s => s.status === "completed");
      const sessionIds = completedSessions.map(s => s.id);

      // Get sets data
      let sets: any[] = [];
      if (sessionIds.length > 0) {
        const { data: setsData } = await supabase
          .from("workout_sets" as any)
          .select("id, session_id, exercise_id, weight_kg, reps, rpe, velocity_metrics, created_at, completed_at")
          .in("session_id", sessionIds);
        sets = (setsData || []) as any[];
      }

      // Get exercise statistics for PRs
      const { data: exerciseStats } = await supabase
        .from("exercise_statistics" as any)
        .select("*")
        .eq("user_id", clientId);

      // Get PR history
      const { data: prHistory } = await supabase
        .from("pr_history" as any)
        .select("*")
        .eq("user_id", clientId)
        .gte("achieved_at", fourWeeksAgo.toISOString())
        .order("achieved_at", { ascending: false });

      // Fetch nutrition data
      const { data: nutritionLogs } = await supabase
        .from("nutrition_logs")
        .select("id, date, target_calories, target_protein, notes")
        .eq("user_id", clientId)
        .gte("date", format(fourWeeksAgo, "yyyy-MM-dd"));

      const logIds = (nutritionLogs || []).map(l => l.id);
      let mealItems: any[] = [];
      if (logIds.length > 0) {
        const { data: meals } = await supabase
          .from("meals")
          .select("id, nutrition_log_id")
          .in("nutrition_log_id", logIds);

        const mealIds = (meals || []).map(m => m.id);
        if (mealIds.length > 0) {
          const { data: itemsData } = await supabase
            .from("meal_items")
            .select("id, meal_id, calories, protein, carbs, fat")
            .in("meal_id", mealIds);
          mealItems = itemsData || [];
        }
      }

      // Get exercise names for context
      const uniqueExerciseIds = [...new Set(sets.map(s => s.exercise_id))];
      const exerciseNameMap = new Map<string, string>();
      if (uniqueExerciseIds.length > 0) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("id, title, muscle_group")
          .in("id", uniqueExerciseIds);
        (exercises || []).forEach((ex: any) => {
          exerciseNameMap.set(ex.id, ex.title);
        });
      }

      // ============ CALCULATE WEEKLY STATS ============
      const weeklyStats: WeeklyStats[] = [];
      for (let i = 0; i < 8; i++) {
        const weekStart = subDays(now, (7 - i) * 7 + 7);
        const weekEnd = subDays(now, (7 - i) * 7);

        const weekSessions = completedSessions.filter(s => {
          const date = new Date(s.started_at);
          return date >= weekStart && date < weekEnd;
        });

        const weekSessionIds = weekSessions.map(s => s.id);
        const weekSets = sets.filter(s => weekSessionIds.includes(s.session_id));

        const weekVolume = weekSets.reduce((sum, s) =>
          sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);

        const rpeSets = weekSets.filter(s => s.rpe);
        const avgRpe = rpeSets.length > 0
          ? rpeSets.reduce((sum, s) => sum + s.rpe, 0) / rpeSets.length
          : null;

        const weekPRs = (prHistory || []).filter(pr => {
          const date = new Date(pr.achieved_at);
          return date >= weekStart && date < weekEnd;
        }).length;

        weeklyStats.push({
          weekStart: format(weekStart, "MMM d"),
          sessions: weekSessions.length,
          volume: Math.round(weekVolume),
          avgRpe,
          prs: weekPRs
        });
      }

      // ============ CALCULATE TRAINING PATTERNS ============
      const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      completedSessions.forEach(s => {
        const day = getDay(new Date(s.started_at));
        dayCount[day]++;
      });

      const preferredDays = Object.entries(dayCount)
        .sort(([, a], [, b]) => b - a)
        .filter(([, count]) => count > 0)
        .slice(0, 3)
        .map(([day]) => dayNames[parseInt(day)]);

      const avgSessionDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
        : 0;

      // Calculate rest days between sessions
      let totalRestDays = 0;
      for (let i = 1; i < completedSessions.length; i++) {
        const diff = differenceInDays(
          new Date(completedSessions[i].started_at),
          new Date(completedSessions[i - 1].started_at)
        );
        totalRestDays += diff - 1;
      }
      const avgRestDays = completedSessions.length > 1
        ? totalRestDays / (completedSessions.length - 1)
        : 0;

      // Most trained muscles (from exercise stats)
      const muscleCount: Record<string, number> = {};
      (exerciseStats || []).forEach((stat: any) => {
        if (stat.muscle_group) {
          muscleCount[stat.muscle_group] = (muscleCount[stat.muscle_group] || 0) + stat.total_sessions;
        }
      });

      const mostTrainedMuscles = Object.entries(muscleCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([muscle, sessions]) => ({ muscle, sessions }));

      const trainingPattern: TrainingPattern = {
        preferredDays,
        avgSessionDuration: Math.round(avgSessionDuration),
        avgRestDays: Math.round(avgRestDays * 10) / 10,
        mostTrainedMuscles,
        peakTrainingTime: "Morning" // Could be calculated from started_at times
      };

      // ============ CALCULATE STREAKS ============
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastWorkoutDate: Date | null = null;

      // Sort sessions by date descending for streak calculation
      const sortedSessions = [...completedSessions].sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );

      for (const session of sortedSessions) {
        const sessionDate = new Date(session.started_at);

        if (!lastWorkoutDate) {
          // First session
          const daysSinceSession = differenceInDays(now, sessionDate);
          if (daysSinceSession <= 3) { // Allow 3 day gap for "current" streak
            tempStreak = 1;
          }
        } else {
          const daysBetween = differenceInDays(lastWorkoutDate, sessionDate);
          if (daysBetween <= 3) { // Allow 3 day gaps in streak
            tempStreak++;
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            if (currentStreak === 0) currentStreak = tempStreak;
            tempStreak = 1;
          }
        }
        lastWorkoutDate = sessionDate;
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;
      if (currentStreak === 0) currentStreak = tempStreak;

      // ============ QUICK STATS ============
      const recentSessions = completedSessions.filter(s =>
        new Date(s.started_at) >= fourWeeksAgo
      );
      const totalVolume = sets
        .filter(s => sessionIds.includes(s.session_id))
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);

      const quickStats = {
        totalWorkouts: completedSessions.length,
        avgPerWeek: recentSessions.length / 4,
        totalVolume: Math.round(totalVolume),
        prsThisMonth: (prHistory || []).length,
        currentStreak,
        longestStreak
      };

      // ============ ANALYZE WORKOUT CONSISTENCY ============
      const last2WeeksSessions = completedSessions.filter(s =>
        new Date(s.started_at) >= twoWeeksAgo
      );
      const prev2WeeksSessions = completedSessions.filter(s => {
        const date = new Date(s.started_at);
        return date >= fourWeeksAgo && date < twoWeeksAgo;
      });

      const recentWeeklyAvg = last2WeeksSessions.length / 2;
      const prevWeeklyAvg = prev2WeeksSessions.length / 2;

      if (last2WeeksSessions.length >= 6) {
        insights.push({
          id: "consistency-high",
          type: "consistency",
          category: "behavior",
          priority: "medium",
          title: "Excellent Training Consistency",
          description: `Training ${recentWeeklyAvg.toFixed(1)}x per week. Keep it up!`,
          metric: `${last2WeeksSessions.length} sessions in 2 weeks`,
          trend: "up",
        });
      } else if (last2WeeksSessions.length < 2 && prev2WeeksSessions.length >= 4) {
        insights.push({
          id: "consistency-dropping",
          type: "warning",
          category: "behavior",
          priority: "high",
          title: "Training Frequency Dropping",
          description: "Training frequency has dropped significantly in the last 2 weeks.",
          metric: `${last2WeeksSessions.length} vs ${prev2WeeksSessions.length} sessions`,
          trend: "down",
          actionable: "Check in with client - are there any obstacles?",
        });
      } else if (last2WeeksSessions.length === 0 && completedSessions.length > 0) {
        const lastSession = sortedSessions[0];
        const daysSinceLast = differenceInDays(now, new Date(lastSession.started_at));
        insights.push({
          id: "no-recent-training",
          type: "warning",
          category: "behavior",
          priority: "high",
          title: "No Recent Training",
          description: `${daysSinceLast} days since last workout.`,
          actionable: "Reach out and motivate to resume training.",
        });
      }

      // ============ ANALYZE VOLUME PROGRESSION ============
      const recentVolume = sets
        .filter(s => {
          const session = completedSessions.find(sess => sess.id === s.session_id);
          return session && new Date(session.started_at) >= twoWeeksAgo;
        })
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);

      const prevVolume = sets
        .filter(s => {
          const session = completedSessions.find(sess => sess.id === s.session_id);
          if (!session) return false;
          const date = new Date(session.started_at);
          return date >= fourWeeksAgo && date < twoWeeksAgo;
        })
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);

      if (prevVolume > 0) {
        const volumeChange = ((recentVolume - prevVolume) / prevVolume) * 100;

        if (volumeChange > 15) {
          insights.push({
            id: "volume-increase",
            type: "volume",
            category: "training",
            priority: "medium",
            title: "Training Volume Increasing Significantly",
            description: "Total volume increased by more than 15% - ensure adequate recovery.",
            metric: `+${Math.round(volumeChange)}%`,
            trend: "up",
            actionable: volumeChange > 30 ? "Consider reducing volume to prevent overtraining." : undefined,
          });
        } else if (volumeChange < -25) {
          insights.push({
            id: "volume-decrease",
            type: "warning",
            category: "training",
            priority: "medium",
            title: "Training Volume Decreased",
            description: "Significant volume drop - is this a planned deload?",
            metric: `${Math.round(volumeChange)}%`,
            trend: "down",
            actionable: "Check if deload was planned or adjustments are needed.",
          });
        }
      }

      // ============ ANALYZE PRs ============
      const recentPRs = prHistory || [];
      if (recentPRs.length > 0) {
        const thisWeekPRs = recentPRs.filter(pr =>
          new Date(pr.achieved_at) >= oneWeekAgo
        );

        if (thisWeekPRs.length >= 3) {
          insights.push({
            id: "pr-streak",
            type: "celebration",
            category: "progress",
            priority: "low",
            title: "PR Week!",
            description: `${thisWeekPRs.length} new personal records this week!`,
            metric: `${thisWeekPRs.length} PRs`,
            trend: "up",
          });
        } else if (thisWeekPRs.length > 0) {
          insights.push({
            id: "new-prs",
            type: "pr",
            category: "progress",
            priority: "medium",
            title: "New PRs Achieved",
            description: `${thisWeekPRs.length} new personal records in the last 7 days.`,
            metric: `${thisWeekPRs.length} PRs`,
            trend: "up",
          });
        }

        // Check for long PR drought
        const daysSinceLastPR = differenceInDays(now, new Date(recentPRs[0].achieved_at));
        if (daysSinceLastPR > 21 && completedSessions.length > 5) {
          insights.push({
            id: "pr-plateau",
            type: "recommendation",
            category: "progress",
            priority: "medium",
            title: "Plateau Detected",
            description: `No new PR in ${daysSinceLastPR} days - time for variation?`,
            actionable: "Review progressive overload or vary training program.",
          });
        }
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
            category: "recovery",
            priority: "high",
            title: "High Fatigue Detected",
            description: `Average velocity loss of ${avgVelocityLoss.toFixed(0)}% indicates high fatigue.`,
            metric: `${avgVelocityLoss.toFixed(0)}% avg`,
            trend: "down",
            actionable: "Reduce volume/intensity or plan more recovery.",
          });
        } else if (avgVelocityLoss < 15) {
          insights.push({
            id: "velocity-optimal",
            type: "velocity",
            category: "training",
            priority: "low",
            title: "Optimal Training Intensity",
            description: "Velocity loss in optimal range for strength gains.",
            metric: `${avgVelocityLoss.toFixed(0)}% avg`,
            trend: "stable",
          });
        }

        // Analyze velocity trends
        const recentVbtSets = vbtSets.filter(s => {
          const session = completedSessions.find(sess => sess.id === s.session_id);
          return session && new Date(session.started_at) >= twoWeeksAgo;
        });
        const olderVbtSets = vbtSets.filter(s => {
          const session = completedSessions.find(sess => sess.id === s.session_id);
          if (!session) return false;
          const date = new Date(session.started_at);
          return date >= fourWeeksAgo && date < twoWeeksAgo;
        });

        if (recentVbtSets.length >= 3 && olderVbtSets.length >= 3) {
          const recentAvgVelocity = recentVbtSets.reduce(
            (sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0
          ) / recentVbtSets.length;
          const olderAvgVelocity = olderVbtSets.reduce(
            (sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0), 0
          ) / olderVbtSets.length;

          if (recentAvgVelocity < olderAvgVelocity * 0.9) {
            insights.push({
              id: "velocity-declining",
              type: "warning",
              category: "recovery",
              priority: "high",
              title: "Velocity Declining",
              description: "Average movement velocity is decreasing - possible overtraining.",
              metric: `${((1 - recentAvgVelocity / olderAvgVelocity) * 100).toFixed(0)}% slower`,
              trend: "down",
              actionable: "Deload week or reduced intensity recommended.",
            });
          }
        }
      }

      // ============ ANALYZE RPE ============
      const rpeSets = sets.filter(s => s.rpe != null);
      if (rpeSets.length >= 10) {
        const avgRpe = rpeSets.reduce((sum, s) => sum + s.rpe, 0) / rpeSets.length;

        const recentRpeSets = rpeSets.filter(s => {
          const session = completedSessions.find(sess => sess.id === s.session_id);
          return session && new Date(session.started_at) >= twoWeeksAgo;
        });

        if (recentRpeSets.length >= 5) {
          const recentAvgRpe = recentRpeSets.reduce((sum, s) => sum + s.rpe, 0) / recentRpeSets.length;

          if (recentAvgRpe >= 9) {
            insights.push({
              id: "rpe-high",
              type: "recovery",
              category: "recovery",
              priority: "high",
              title: "Training at Maximum Effort",
              description: "Average RPE very high - risk of burnout.",
              metric: `Avg RPE: ${recentAvgRpe.toFixed(1)}`,
              actionable: "Plan deload weeks, vary intensity throughout the week.",
            });
          } else if (recentAvgRpe < 6 && recentVolume > 0) {
            insights.push({
              id: "rpe-low",
              type: "recommendation",
              category: "training",
              priority: "medium",
              title: "Room for Growth",
              description: "RPE indicates there's potential for more intensity.",
              metric: `Avg RPE: ${recentAvgRpe.toFixed(1)}`,
              actionable: "Progressive overload - increase weight or reps.",
            });
          }
        }
      }

      // ============ ANALYZE TRAINING PATTERNS ============
      if (preferredDays.length > 0 && completedSessions.length >= 8) {
        // Check for imbalanced training
        const topDayCount = dayCount[dayNames.indexOf(preferredDays[0]) as keyof typeof dayCount] || 0;
        const totalDays = Object.values(dayCount).reduce((a, b) => a + b, 0);

        if (topDayCount / totalDays > 0.4) {
          insights.push({
            id: "training-concentrated",
            type: "pattern",
            category: "behavior",
            priority: "low",
            title: "Training Concentrated",
            description: `Most workouts are on ${preferredDays[0]}s - variation could help.`,
            data: { preferredDays, dayCount },
          });
        }

        // Check rest days
        if (avgRestDays < 1) {
          insights.push({
            id: "rest-days-low",
            type: "warning",
            category: "recovery",
            priority: "high",
            title: "Insufficient Recovery",
            description: "Less than 1 rest day on average between sessions.",
            metric: `${avgRestDays.toFixed(1)} days rest`,
            actionable: "Plan at least 1-2 rest days per week.",
          });
        } else if (avgRestDays > 4) {
          insights.push({
            id: "rest-days-high",
            type: "recommendation",
            category: "behavior",
            priority: "medium",
            title: "Long Gaps Between Training",
            description: "More than 4 days on average between workouts.",
            metric: `${avgRestDays.toFixed(1)} days rest`,
            actionable: "Increase training frequency for better results.",
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
            category: "nutrition",
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
            category: "nutrition",
            priority: "medium",
            title: "Improve Nutrition Tracking",
            description: "Inconsistent tracking makes optimization difficult.",
            metric: `Only ${Math.round(adherence)}% days logged`,
            actionable: "Encourage daily meal logging, even estimates help.",
          });
        }

        // Check macros
        if (mealItems.length > 0) {
          const totalProtein = mealItems.reduce((sum, i) => sum + (i.protein || 0), 0);
          const totalCalories = mealItems.reduce((sum, i) => sum + (i.calories || 0), 0);
          const avgDailyProtein = totalProtein / Math.max(daysWithLogs, 1);
          const avgDailyCalories = totalCalories / Math.max(daysWithLogs, 1);

          if (avgDailyProtein > 0 && avgDailyProtein < 100) {
            insights.push({
              id: "protein-low",
              type: "nutrition",
              category: "nutrition",
              priority: "high",
              title: "Protein Intake May Be Low",
              description: "Average daily protein may be insufficient for optimal muscle building.",
              metric: `~${Math.round(avgDailyProtein)}g/day`,
              actionable: "Target: 1.6-2.2g protein per kg body weight.",
            });
          } else if (avgDailyProtein >= 150) {
            insights.push({
              id: "protein-high",
              type: "nutrition",
              category: "nutrition",
              priority: "low",
              title: "Good Protein Intake",
              description: "Protein intake in optimal range for muscle building.",
              metric: `~${Math.round(avgDailyProtein)}g/day`,
              trend: "stable",
            });
          }
        }
      } else if (!nutritionLogs || nutritionLogs.length === 0) {
        insights.push({
          id: "no-nutrition-tracking",
          type: "recommendation",
          category: "nutrition",
          priority: "medium",
          title: "No Nutrition Tracking",
          description: "Nutrition data would enable better insights.",
          actionable: "Encourage client to track meals.",
        });
      }

      // ============ CELEBRATION INSIGHTS ============
      if (currentStreak >= 4) {
        insights.push({
          id: "streak-active",
          type: "celebration",
          category: "behavior",
          priority: "low",
          title: `${currentStreak}-Workout Streak!`,
          description: "Consistent training is paying off!",
        });
      }

      if (completedSessions.length >= 20) {
        insights.push({
          id: "milestone-sessions",
          type: "celebration",
          category: "progress",
          priority: "low",
          title: "Training Milestone!",
          description: `${completedSessions.length} workouts completed in the last 8 weeks!`,
        });
      }

      if (quickStats.prsThisMonth >= 5) {
        insights.push({
          id: "pr-month",
          type: "celebration",
          category: "progress",
          priority: "low",
          title: "Strong Month!",
          description: `${quickStats.prsThisMonth} PRs in the last 4 weeks - great progress!`,
        });
      }

      // ============ SORT & CALCULATE SCORES ============
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      // Calculate category scores (0-100)
      let trainingScore = 60;
      let nutritionScore = 50;
      let consistencyScore = 50;
      let progressScore = 50;

      insights.forEach(insight => {
        const adjustment = insight.priority === "high" ? 15 : insight.priority === "medium" ? 10 : 5;
        const isPositive = insight.type === "celebration" || insight.trend === "up" ||
                          insight.type === "consistency" || insight.type === "pr";
        const isNegative = insight.type === "warning";

        switch (insight.category) {
          case "training":
            trainingScore += isPositive ? adjustment : isNegative ? -adjustment : 0;
            break;
          case "nutrition":
            nutritionScore += isPositive ? adjustment : isNegative ? -adjustment : 0;
            break;
          case "behavior":
            consistencyScore += isPositive ? adjustment : isNegative ? -adjustment : 0;
            break;
          case "progress":
            progressScore += isPositive ? adjustment : isNegative ? -adjustment : 0;
            break;
          case "recovery":
            trainingScore += isNegative ? -adjustment / 2 : 0;
            break;
        }
      });

      // Clamp scores
      trainingScore = Math.max(0, Math.min(100, trainingScore));
      nutritionScore = Math.max(0, Math.min(100, nutritionScore));
      consistencyScore = Math.max(0, Math.min(100, consistencyScore));
      progressScore = Math.max(0, Math.min(100, progressScore));

      const overallScore = Math.round(
        (trainingScore * 0.3 + nutritionScore * 0.2 + consistencyScore * 0.3 + progressScore * 0.2)
      );

      // Identify strengths and areas to improve
      const strengths = insights
        .filter(i => i.type === "celebration" || i.trend === "up" || i.type === "consistency" || i.type === "pr")
        .map(i => i.title)
        .slice(0, 3);

      const areasToImprove = insights
        .filter(i => i.type === "warning" || i.type === "recommendation")
        .map(i => i.title)
        .slice(0, 3);

      const summary: InsightsSummary = {
        overallScore,
        trainingScore,
        nutritionScore,
        consistencyScore,
        progressScore,
        strengths,
        areasToImprove,
        topInsight: insights[0] || null,
        weeklyTrend: weeklyStats,
        trainingPattern: completedSessions.length >= 5 ? trainingPattern : null,
        quickStats,
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
