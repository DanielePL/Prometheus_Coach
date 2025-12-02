import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  Dumbbell,
  ChevronRight,
  Calendar,
  Medal,
  Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useClientEnhancedPRs,
  useExercisePRHistory,
} from "@/hooks/useEnhancedPRTracking";
import { format, formatDistanceToNow } from "date-fns";

interface ClientPRsTabProps {
  clientId: string;
}

export const ClientPRsTab = ({ clientId }: ClientPRsTabProps) => {
  const { data, isLoading, error } = useClientEnhancedPRs(clientId);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data: prHistory, isLoading: historyLoading } = useExercisePRHistory(
    clientId,
    selectedExercise || ""
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
        <p className="text-red-500">Error loading PR data</p>
      </div>
    );
  }

  const { prs, totalPRs, highestEstimated1RM, mostRecentPR, prsByMuscleGroup } =
    data || {
      prs: [],
      totalPRs: 0,
      highestEstimated1RM: 0,
      mostRecentPR: null,
      prsByMuscleGroup: [],
    };

  if (totalPRs === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">No Personal Records Yet</h3>
        <p className="text-muted-foreground">
          Complete workouts to start tracking personal records.
        </p>
      </div>
    );
  }

  const summaryStats = [
    {
      icon: Trophy,
      label: "Total PRs",
      value: totalPRs,
      color: "text-yellow-500",
    },
    {
      icon: Target,
      label: "Best Est. 1RM",
      value: `${highestEstimated1RM} kg`,
      color: "text-primary",
    },
    {
      icon: Calendar,
      label: "Latest PR",
      value: mostRecentPR
        ? formatDistanceToNow(new Date(mostRecentPR.achievedAt), {
            addSuffix: true,
          })
        : "N/A",
      color: "text-green-500",
    },
  ];

  // Prepare history chart data
  const historyChartData = prHistory
    ?.filter((p) => p.isNewMax)
    .map((p) => ({
      date: format(new Date(p.date), "MMM d"),
      weight: p.weight,
      estimated1RM: p.estimated1RM,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        ))}
      </div>

      {/* Most Recent PR Highlight */}
      {mostRecentPR && (
        <div className="glass rounded-2xl p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Most Recent PR</p>
              <h3 className="text-xl font-bold">{mostRecentPR.exerciseName}</h3>
              <div className="flex items-center gap-4 mt-1">
                <Badge
                  variant="outline"
                  className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50"
                >
                  {mostRecentPR.weightUsed} kg x {mostRecentPR.repsCompleted}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Est. 1RM: {mostRecentPR.estimated1RM} kg
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {format(new Date(mostRecentPR.achievedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRs by Muscle Group */}
      {prsByMuscleGroup && prsByMuscleGroup.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">PRs by Muscle Group</h2>
              <p className="text-sm text-muted-foreground">
                Distribution of personal records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {prsByMuscleGroup.map(([muscleGroup, count]) => (
              <Badge
                key={muscleGroup}
                variant="outline"
                className="text-base px-4 py-2"
              >
                {muscleGroup}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* All PRs List */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">All Personal Records</h2>
            <p className="text-sm text-muted-foreground">
              Click to see progression history
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {prs.map((pr, i) => (
            <div
              key={pr.id}
              className={`p-4 rounded-xl bg-background/50 border transition-all cursor-pointer ${
                selectedExercise === pr.exerciseId
                  ? "border-primary"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() =>
                setSelectedExercise(
                  selectedExercise === pr.exerciseId ? null : pr.exerciseId
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-500"
                        : i === 1
                        ? "bg-gray-400/20 text-gray-400"
                        : i === 2
                        ? "bg-orange-500/20 text-orange-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{pr.exerciseName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pr.muscleGroup || "General"} ·{" "}
                      {format(new Date(pr.achievedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">
                      {pr.weightUsed} kg x {pr.repsCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Est. 1RM: {pr.estimated1RM} kg
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      selectedExercise === pr.exerciseId ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded History */}
              {selectedExercise === pr.exerciseId && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  {historyLoading ? (
                    <Skeleton className="h-[200px]" />
                  ) : historyChartData && historyChartData.length > 1 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Estimated 1RM Progression
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={historyChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickFormatter={(v) => `${v}kg`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value} kg`, "Est. 1RM"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="estimated1RM"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Not enough data for progression chart
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
