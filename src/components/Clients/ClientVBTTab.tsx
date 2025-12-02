import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Dumbbell,
  ChevronRight,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useClientVBT,
  useExerciseVelocityTrend,
  VBTSummary,
  ExerciseVBTStats,
} from "@/hooks/useClientVBT";
import { format } from "date-fns";

interface ClientVBTTabProps {
  clientId: string;
}

export const ClientVBTTab = ({ clientId }: ClientVBTTabProps) => {
  const { data, isLoading, error } = useClientVBT(clientId);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data: velocityTrend, isLoading: trendLoading } =
    useExerciseVelocityTrend(clientId, selectedExercise || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-500">Error loading VBT data</p>
      </div>
    );
  }

  const { sessions, summary, exerciseStats } = data || {
    sessions: [],
    summary: null,
    exerciseStats: [],
  };

  if (!summary || summary.totalSets === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">No VBT Data Yet</h3>
        <p className="text-muted-foreground">
          This client hasn't recorded any velocity-based training sessions yet.
        </p>
      </div>
    );
  }

  const summaryStats = [
    {
      icon: Dumbbell,
      label: "Total Sets",
      value: summary.totalSets,
      subValue: `${summary.setsWithVBT} with VBT`,
      color: "text-primary",
    },
    {
      icon: Zap,
      label: "Avg Peak Velocity",
      value: `${summary.avgPeakVelocity.toFixed(2)} m/s`,
      subValue: "Across all exercises",
      color: "text-yellow-500",
    },
    {
      icon: TrendingDown,
      label: "Avg Velocity Loss",
      value: `${summary.avgVelocityLoss.toFixed(1)}%`,
      subValue: summary.avgVelocityLoss < 20 ? "Optimal fatigue" : "High fatigue",
      color: summary.avgVelocityLoss < 20 ? "text-green-500" : "text-orange-500",
    },
    {
      icon: Target,
      label: "Total Volume",
      value: `${(summary.totalVolume / 1000).toFixed(1)}t`,
      subValue: `${summary.totalReps} total reps`,
      color: "text-blue-500",
    },
  ];

  // Prepare session velocity trend data
  const sessionTrendData = sessions
    .slice(0, 20)
    .reverse()
    .map((session) => {
      const vbtSets = session.workout_sets?.filter((s) => s.velocity_metrics) || [];
      const avgVelocity =
        vbtSets.length > 0
          ? vbtSets.reduce(
              (sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0),
              0
            ) / vbtSets.length
          : 0;
      return {
        date: format(new Date(session.started_at), "MMM d"),
        velocity: Number(avgVelocity.toFixed(2)),
        workout: session.workout_name,
      };
    });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Velocity Trend Over Sessions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Velocity Trend</h2>
            <p className="text-sm text-muted-foreground">
              Average peak velocity per workout session
            </p>
          </div>
        </div>

        {sessionTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sessionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={["dataMin - 0.1", "dataMax + 0.1"]}
                tickFormatter={(v) => `${v} m/s`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} m/s`, "Avg Velocity"]}
              />
              <Line
                type="monotone"
                dataKey="velocity"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Not enough data for trend chart
          </div>
        )}
      </div>

      {/* Per-Exercise Stats */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Exercise VBT Stats</h2>
              <p className="text-sm text-muted-foreground">
                Click an exercise to see velocity trend
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {exerciseStats.slice(0, 10).map((exercise) => (
            <div
              key={exercise.exerciseId}
              className={`p-4 rounded-xl bg-background/50 border transition-all cursor-pointer ${
                selectedExercise === exercise.exerciseId
                  ? "border-primary"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() =>
                setSelectedExercise(
                  selectedExercise === exercise.exerciseId
                    ? null
                    : exercise.exerciseId
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{exercise.exerciseName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} sets · Avg {exercise.avgWeight.toFixed(1)} kg
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {exercise.avgPeakVelocity.toFixed(2)} m/s
                    </Badge>
                    {exercise.estimated1RM && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Est. 1RM: {exercise.estimated1RM.toFixed(1)} kg
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      selectedExercise === exercise.exerciseId
                        ? "rotate-90"
                        : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Exercise Velocity Trend */}
              {selectedExercise === exercise.exerciseId && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  {trendLoading ? (
                    <Skeleton className="h-[200px]" />
                  ) : velocityTrend && velocityTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={velocityTrend.slice(-15)}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(v) => format(new Date(v), "M/d")}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "velocity"
                              ? `${value} m/s`
                              : `${value} kg`,
                            name === "velocity" ? "Velocity" : "Weight",
                          ]}
                        />
                        <Bar
                          dataKey="velocity"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No velocity data for this exercise
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent VBT Sessions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recent Sessions</h2>
            <p className="text-sm text-muted-foreground">
              Last {Math.min(sessions.length, 10)} workout sessions
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sessions.slice(0, 10).map((session) => {
            const vbtSets =
              session.workout_sets?.filter((s) => s.velocity_metrics) || [];
            const avgVelocity =
              vbtSets.length > 0
                ? vbtSets.reduce(
                    (sum, s) => sum + (s.velocity_metrics?.avg_peak_velocity || 0),
                    0
                  ) / vbtSets.length
                : 0;

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold">{session.workout_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.started_at), "MMM d, yyyy")} ·{" "}
                    {session.duration_minutes || 0} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.workout_sets?.length || 0} sets
                  </p>
                  {vbtSets.length > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50 mt-1"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {avgVelocity.toFixed(2)} m/s avg
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VBT Info Card */}
      <div className="glass rounded-2xl p-6 bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">
              Understanding VBT Metrics
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Peak Velocity:</strong> Maximum bar speed during the
                concentric phase
              </li>
              <li>
                <strong>Velocity Loss:</strong> Drop from first to last rep (aim
                for &lt;20% for strength)
              </li>
              <li>
                <strong>Est. 1RM:</strong> Estimated one-rep max based on
                load-velocity relationship
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};