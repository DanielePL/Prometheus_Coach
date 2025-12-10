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
          title: "Ausgezeichnete Trainings-Konsistenz",
          description: `Trainiert ${recentWeeklyAvg.toFixed(1)}x pro Woche. Weiter so!`,
          metric: `${last2WeeksSessions.length} Sessions in 2 Wochen`,
          trend: "up",
        });
      } else if (last2WeeksSessions.length < 2 && prev2WeeksSessions.length >= 4) {
        insights.push({
          id: "consistency-dropping",
          type: "warning",
          category: "behavior",
          priority: "high",
          title: "Trainingsfrequenz sinkt",
          description: "Die Trainingshäufigkeit ist in den letzten 2 Wochen deutlich gesunken.",
          metric: `${last2WeeksSessions.length} vs ${prev2WeeksSessions.length} Sessions`,
          trend: "down",
          actionable: "Check-in mit dem Klienten - gibt es Hindernisse?",
        });
      } else if (last2WeeksSessions.length === 0 && completedSessions.length > 0) {
        const lastSession = sortedSessions[0];
        const daysSinceLast = differenceInDays(now, new Date(lastSession.started_at));
        insights.push({
          id: "no-recent-training",
          type: "warning",
          category: "behavior",
          priority: "high",
          title: "Kein aktuelles Training",
          description: `${daysSinceLast} Tage seit dem letzten Workout.`,
          actionable: "Kontaktieren und motivieren, wieder zu trainieren.",
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
            title: "Trainingsvolumen steigt stark",
            description: "Das Gesamtvolumen ist um mehr als 15% gestiegen - achte auf ausreichende Erholung.",
            metric: `+${Math.round(volumeChange)}%`,
            trend: "up",
            actionable: volumeChange > 30 ? "Evtl. Volumen reduzieren um Übertraining zu vermeiden." : undefined,
          });
        } else if (volumeChange < -25) {
          insights.push({
            id: "volume-decrease",
            type: "warning",
            category: "training",
            priority: "medium",
            title: "Trainingsvolumen gesunken",
            description: "Deutlicher Volumenrückgang - ist das geplant (Deload)?",
            metric: `${Math.round(volumeChange)}%`,
            trend: "down",
            actionable: "Prüfen ob Deload geplant war oder Anpassungen nötig sind.",
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
            title: "PR-Woche!",
            description: `${thisWeekPRs.length} neue persönliche Rekorde diese Woche!`,
            metric: `${thisWeekPRs.length} PRs`,
            trend: "up",
          });
        } else if (thisWeekPRs.length > 0) {
          insights.push({
            id: "new-prs",
            type: "pr",
            category: "progress",
            priority: "medium",
            title: "Neue PRs erreicht",
            description: `${thisWeekPRs.length} neue persönliche Rekorde in den letzten 7 Tagen.`,
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
            title: "Plateau erkannt",
            description: `Seit ${daysSinceLastPR} Tagen kein neuer PR - Zeit für Variation?`,
            actionable: "Progressive Overload prüfen oder Trainingsplan variieren.",
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
            title: "Hohe Ermüdung erkannt",
            description: `Durchschnittlicher Velocity Loss von ${avgVelocityLoss.toFixed(0)}% zeigt hohe Ermüdung an.`,
            metric: `${avgVelocityLoss.toFixed(0)}% avg`,
            trend: "down",
            actionable: "Volumen/Intensität reduzieren oder mehr Erholung einplanen.",
          });
        } else if (avgVelocityLoss < 15) {
          insights.push({
            id: "velocity-optimal",
            type: "velocity",
            category: "training",
            priority: "low",
            title: "Optimale Trainingsintensität",
            description: "Velocity Loss im optimalen Bereich für Kraftzuwachs.",
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
              title: "Velocity sinkt",
              description: "Die durchschnittliche Bewegungsgeschwindigkeit ist rückläufig - mögliches Übertraining.",
              metric: `${((1 - recentAvgVelocity / olderAvgVelocity) * 100).toFixed(0)}% langsamer`,
              trend: "down",
              actionable: "Deload-Woche oder reduzierte Intensität empfohlen.",
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
              title: "Training am Limit",
              description: "Durchschnittliches RPE sehr hoch - Burnout-Risiko.",
              metric: `Avg RPE: ${recentAvgRpe.toFixed(1)}`,
              actionable: "Deload-Wochen einplanen, Intensität über die Woche variieren.",
            });
          } else if (recentAvgRpe < 6 && recentVolume > 0) {
            insights.push({
              id: "rpe-low",
              type: "recommendation",
              category: "training",
              priority: "medium",
              title: "Potenzial für mehr",
              description: "RPE zeigt: hier ist noch Luft nach oben.",
              metric: `Avg RPE: ${recentAvgRpe.toFixed(1)}`,
              actionable: "Progressive Overload - Gewicht oder Wiederholungen steigern.",
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
            title: "Training konzentriert",
            description: `Die meisten Workouts sind ${preferredDays[0]}s - Variation könnte helfen.`,
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
            title: "Zu wenig Erholung",
            description: "Durchschnittlich weniger als 1 Ruhetag zwischen Sessions.",
            metric: `${avgRestDays.toFixed(1)} Tage Pause`,
            actionable: "Mindestens 1-2 Ruhetage pro Woche einplanen.",
          });
        } else if (avgRestDays > 4) {
          insights.push({
            id: "rest-days-high",
            type: "recommendation",
            category: "behavior",
            priority: "medium",
            title: "Lange Pausen zwischen Training",
            description: "Durchschnittlich über 4 Tage zwischen den Workouts.",
            metric: `${avgRestDays.toFixed(1)} Tage Pause`,
            actionable: "Trainingsfrequenz erhöhen für bessere Resultate.",
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
            title: "Starkes Nutrition Tracking",
            description: `${Math.round(adherence)}% Logging-Adherence zeigt exzellentes Commitment.`,
            metric: `${daysWithLogs}/${expectedDays} Tage geloggt`,
            trend: "up",
          });
        } else if (adherence < 50) {
          insights.push({
            id: "nutrition-inconsistent",
            type: "warning",
            category: "nutrition",
            priority: "medium",
            title: "Nutrition Tracking verbessern",
            description: "Unregelmäßiges Tracking erschwert die Optimierung.",
            metric: `Nur ${Math.round(adherence)}% Tage geloggt`,
            actionable: "Tägliches Meal-Logging ermutigen, auch Schätzungen helfen.",
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
              title: "Proteinzufuhr möglicherweise zu niedrig",
              description: "Durchschnittliches tägliches Protein könnte für optimalen Muskelaufbau zu gering sein.",
              metric: `~${Math.round(avgDailyProtein)}g/Tag`,
              actionable: "Ziel: 1.6-2.2g Protein pro kg Körpergewicht.",
            });
          } else if (avgDailyProtein >= 150) {
            insights.push({
              id: "protein-high",
              type: "nutrition",
              category: "nutrition",
              priority: "low",
              title: "Gute Proteinzufuhr",
              description: "Proteinaufnahme im optimalen Bereich für Muskelaufbau.",
              metric: `~${Math.round(avgDailyProtein)}g/Tag`,
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
          title: "Kein Nutrition Tracking",
          description: "Ernährungsdaten würden bessere Insights ermöglichen.",
          actionable: "Klienten ermutigen, Mahlzeiten zu tracken.",
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
          description: "Konstantes Training zahlt sich aus!",
        });
      }

      if (completedSessions.length >= 20) {
        insights.push({
          id: "milestone-sessions",
          type: "celebration",
          category: "progress",
          priority: "low",
          title: "Training-Meilenstein!",
          description: `${completedSessions.length} Workouts in den letzten 8 Wochen absolviert!`,
        });
      }

      if (quickStats.prsThisMonth >= 5) {
        insights.push({
          id: "pr-month",
          type: "celebration",
          category: "progress",
          priority: "low",
          title: "Starker Monat!",
          description: `${quickStats.prsThisMonth} PRs in den letzten 4 Wochen - tolle Fortschritte!`,
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
