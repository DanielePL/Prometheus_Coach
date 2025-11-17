import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Scale, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useClientPersonalRecords } from "@/hooks/usePersonalRecords";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ClientProgressTabProps {
  clientId: string;
}

export const ClientProgressTab = ({ clientId }: ClientProgressTabProps) => {
  const { data: weightLogs, isLoading: weightLoading } = useWeightLogs(clientId);
  const { data: personalRecords, isLoading: prLoading } = useClientPersonalRecords(clientId);

  const isLoading = weightLoading || prLoading;

  const chartData = weightLogs?.map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: Number(log.weight),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weight Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Weight Tracking</h2>
              <p className="text-sm text-muted-foreground">
                {weightLogs && weightLogs.length > 0
                  ? `${weightLogs.length} measurements recorded`
                  : "No measurements yet"}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No weight data to display
          </div>
        )}
      </div>

      {/* Body Measurements */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Body Measurements</h3>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Measurements
          </Button>
        </div>
        <p className="text-muted-foreground">No measurements recorded yet</p>
      </div>

      {/* Progress Photos */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Progress Photos</h3>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>
        <p className="text-muted-foreground">No progress photos uploaded yet</p>
      </div>

      {/* Personal Records */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Personal Records</h2>
              <p className="text-sm text-muted-foreground">
                {personalRecords && personalRecords.length > 0
                  ? `${personalRecords.length} PRs achieved`
                  : "No PRs yet"}
              </p>
            </div>
          </div>
        </div>

        {personalRecords && personalRecords.length > 0 ? (
          <div className="space-y-3">
            {personalRecords.map((pr) => (
              <div
                key={pr.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {pr.exercises?.thumbnail_url && (
                    <img
                      src={pr.exercises.thumbnail_url}
                      alt={pr.exercises.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{pr.exercises?.title || "Unknown Exercise"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(pr.achieved_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  {pr.weight_used} lbs × {pr.reps_completed} reps
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <Trophy className="w-12 h-12 mb-3 opacity-50" />
            <p>No personal records yet</p>
            <p className="text-sm">Complete workouts to start tracking PRs</p>
          </div>
        )}
      </div>
    </div>
  );
};
