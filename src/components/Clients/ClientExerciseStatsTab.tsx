import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Dumbbell,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";

interface ClientExerciseStatsTabProps {
  clientId: string;
}

interface ExerciseStatistic {
  id: string;
  user_id: string;
  exercise_id: string;

  // Weight PR
  pr_weight_kg: number | null;
  pr_weight_reps: number | null;
  pr_weight_date: string | null;

  // Reps PR
  pr_reps: number | null;
  pr_reps_weight_kg: number | null;
  pr_reps_date: string | null;

  // Volume PR
  pr_volume_kg: number | null;
  pr_volume_date: string | null;

  // Velocity PR (VBT)
  pr_velocity: number | null;
  pr_velocity_date: string | null;

  // Estimated 1RM
  estimated_1rm_kg: number | null;
  estimated_1rm_date: string | null;

  // Aggregates
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  total_sessions: number;

  // Timestamps
  first_performed_at: string | null;
  last_performed_at: string | null;
}

interface Exercise {
  id: string;
  title: string;
  muscle_group?: string;
  thumbnail_url?: string;
}

const useClientExerciseStatsWithNames = (clientId: string) => {
  return useQuery({
    queryKey: ["client-exercise-stats-detailed", clientId],
    queryFn: async () => {
      // Fetch exercise statistics
      const { data: stats, error: statsError } = await supabase
        .from("exercise_statistics" as any)
        .select("*")
        .eq("user_id", clientId)
        .order("last_performed_at", { ascending: false });

      if (statsError) {
        if (statsError.code === "42P01") {
          console.log("exercise_statistics table doesn't exist");
          return { stats: [], exercises: new Map() };
        }
        throw statsError;
      }

      if (!stats || stats.length === 0) {
        return { stats: [], exercises: new Map() };
      }

      // Get unique exercise IDs
      const exerciseIds = [...new Set(stats.map((s: any) => s.exercise_id))];

      // Fetch exercise details
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, title, muscle_group, thumbnail_url")
        .in("id", exerciseIds);

      // Create a map for quick lookup
      const exerciseMap = new Map<string, Exercise>();
      (exercises || []).forEach((ex: Exercise) => {
        exerciseMap.set(ex.id, ex);
      });

      return {
        stats: stats as ExerciseStatistic[],
        exercises: exerciseMap,
      };
    },
    enabled: !!clientId,
  });
};

export const ClientExerciseStatsTab = ({ clientId }: ClientExerciseStatsTabProps) => {
  const { data, isLoading, error } = useClientExerciseStatsWithNames(clientId);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-500">Error loading exercise statistics</p>
      </div>
    );
  }

  const { stats, exercises } = data || { stats: [], exercises: new Map() };

  if (stats.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">No Exercise Statistics Yet</h3>
        <p className="text-muted-foreground">
          Exercise statistics will appear here as the client logs workouts in the Prometheus app.
        </p>
      </div>
    );
  }

  // Filter by search
  const filteredStats = stats.filter((stat) => {
    const exercise = exercises.get(stat.exercise_id);
    const name = exercise?.title || stat.exercise_id;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate summary stats
  const totalExercises = stats.length;
  const totalWeightPRs = stats.filter((s) => s.pr_weight_kg).length;
  const totalVolumePRs = stats.filter((s) => s.pr_volume_kg).length;
  const exercisesWithVBT = stats.filter((s) => s.pr_velocity).length;
  const totalLifetimeVolume = stats.reduce((sum, s) => sum + (s.total_volume_kg || 0), 0);

  // Find most recent PR
  const allPRDates = stats
    .flatMap((s) => [s.pr_weight_date, s.pr_reps_date, s.pr_volume_date, s.pr_velocity_date])
    .filter(Boolean)
    .map((d) => new Date(d!));
  const mostRecentPRDate = allPRDates.length > 0 ? new Date(Math.max(...allPRDates.map((d) => d.getTime()))) : null;

  const summaryStats = [
    {
      icon: Dumbbell,
      label: "Exercises Tracked",
      value: totalExercises,
      color: "text-primary",
    },
    {
      icon: Trophy,
      label: "Weight PRs",
      value: totalWeightPRs,
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      label: "Volume PRs",
      value: totalVolumePRs,
      color: "text-green-500",
    },
    {
      icon: Zap,
      label: "VBT Tracked",
      value: exercisesWithVBT,
      color: "text-cyan-500",
    },
  ];

  const getExerciseName = (exerciseId: string): string => {
    return exercises.get(exerciseId)?.title || exerciseId;
  };

  const getExerciseThumbnail = (exerciseId: string): string | undefined => {
    return exercises.get(exerciseId)?.thumbnail_url;
  };

  const getMuscleGroup = (exerciseId: string): string | undefined => {
    return exercises.get(exerciseId)?.muscle_group;
  };

  const toggleExpand = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Lifetime Stats */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-semibold">Lifetime Volume</span>
          </div>
          <span className="text-2xl font-bold">
            {totalLifetimeVolume >= 1000000
              ? `${(totalLifetimeVolume / 1000000).toFixed(1)}M kg`
              : totalLifetimeVolume >= 1000
              ? `${(totalLifetimeVolume / 1000).toFixed(1)}k kg`
              : `${totalLifetimeVolume.toFixed(0)} kg`}
          </span>
        </div>
        {mostRecentPRDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Last PR: {formatDistanceToNow(mostRecentPRDate, { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass"
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        {filteredStats.map((stat) => {
          const isExpanded = expandedExercise === stat.exercise_id;
          const thumbnail = getExerciseThumbnail(stat.exercise_id);
          const muscleGroup = getMuscleGroup(stat.exercise_id);

          return (
            <div key={stat.id} className="glass rounded-xl overflow-hidden">
              {/* Main Row */}
              <div
                className="p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => toggleExpand(stat.exercise_id)}
              >
                <div className="flex items-center gap-4">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={getExerciseName(stat.exercise_id)}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{getExerciseName(stat.exercise_id)}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {muscleGroup && (
                        <Badge variant="outline" className="text-xs">
                          {muscleGroup}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {stat.total_sessions} sessions
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    {stat.pr_weight_kg && (
                      <div className="text-center">
                        <p className="font-bold">{stat.pr_weight_kg} kg</p>
                        <p className="text-xs text-muted-foreground">Weight PR</p>
                      </div>
                    )}
                    {stat.estimated_1rm_kg && (
                      <div className="text-center">
                        <p className="font-bold">{stat.estimated_1rm_kg.toFixed(2)} kg</p>
                        <p className="text-xs text-muted-foreground">Est. 1RM</p>
                      </div>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Weight PR */}
                    {stat.pr_weight_kg && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">Weight PR</span>
                        </div>
                        <p className="text-lg font-bold">{stat.pr_weight_kg} kg</p>
                        {stat.pr_weight_reps && (
                          <p className="text-xs text-muted-foreground">× {stat.pr_weight_reps} reps</p>
                        )}
                        {stat.pr_weight_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stat.pr_weight_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reps PR */}
                    {stat.pr_reps && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Reps PR</span>
                        </div>
                        <p className="text-lg font-bold">{stat.pr_reps} reps</p>
                        {stat.pr_reps_weight_kg && (
                          <p className="text-xs text-muted-foreground">@ {stat.pr_reps_weight_kg} kg</p>
                        )}
                        {stat.pr_reps_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stat.pr_reps_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Volume PR */}
                    {stat.pr_volume_kg && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-muted-foreground">Volume PR</span>
                        </div>
                        <p className="text-lg font-bold">
                          {stat.pr_volume_kg >= 1000
                            ? `${(stat.pr_volume_kg / 1000).toFixed(1)}k`
                            : stat.pr_volume_kg}{" "}
                          kg
                        </p>
                        {stat.pr_volume_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stat.pr_volume_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Estimated 1RM */}
                    {stat.estimated_1rm_kg && (
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Est. 1RM</span>
                        </div>
                        <p className="text-lg font-bold">{stat.estimated_1rm_kg.toFixed(2)} kg</p>
                        {stat.estimated_1rm_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stat.estimated_1rm_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Velocity PR */}
                    {stat.pr_velocity && (
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-cyan-500" />
                          <span className="text-xs text-muted-foreground">Velocity PR</span>
                        </div>
                        <p className="text-lg font-bold">{stat.pr_velocity.toFixed(2)} m/s</p>
                        {stat.pr_velocity_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stat.pr_velocity_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Aggregate Stats */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h5 className="text-sm font-semibold mb-3">Lifetime Stats</h5>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{stat.total_sessions}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{stat.total_sets}</p>
                        <p className="text-xs text-muted-foreground">Sets</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{stat.total_reps}</p>
                        <p className="text-xs text-muted-foreground">Reps</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {stat.total_volume_kg >= 1000
                            ? `${(stat.total_volume_kg / 1000).toFixed(1)}k`
                            : stat.total_volume_kg.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Volume (kg)</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    {stat.first_performed_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        First: {format(new Date(stat.first_performed_at), "MMM d, yyyy")}
                      </span>
                    )}
                    {stat.last_performed_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Last: {formatDistanceToNow(new Date(stat.last_performed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredStats.length === 0 && searchQuery && (
        <div className="glass rounded-xl p-8 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No exercises found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};
