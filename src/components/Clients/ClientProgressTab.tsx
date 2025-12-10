import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Scale, Trophy, Ruler, TrendingUp, TrendingDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useClientPersonalRecords } from "@/hooks/usePersonalRecords";
import { useClientLatestMeasurements, useClientBodyMeasurements } from "@/hooks/useBodyMeasurements";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BodySilhouette } from "@/components/Progress/BodySilhouette";

interface ClientProgressTabProps {
  clientId: string;
}

export const ClientProgressTab = ({ clientId }: ClientProgressTabProps) => {
  const { data: weightLogs, isLoading: weightLoading } = useWeightLogs(clientId);
  const { data: personalRecords, isLoading: prLoading } = useClientPersonalRecords(clientId);
  const { data: latestMeasurements, isLoading: measurementsLoading } = useClientLatestMeasurements(clientId);
  const { data: allMeasurements } = useClientBodyMeasurements(clientId);

  const isLoading = weightLoading || prLoading || measurementsLoading;

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

      {/* Body Measurements with Silhouette */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Body Measurements</h2>
              <p className="text-sm text-muted-foreground">
                {latestMeasurements
                  ? `Last updated ${format(new Date(latestMeasurements.lastUpdated), "MMM d, yyyy")}`
                  : "No measurements yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Body Silhouette */}
          <div className="flex items-center justify-center">
            <BodySilhouette
              measurements={latestMeasurements?.current}
              changes={latestMeasurements?.changes}
              className="py-4"
            />
          </div>

          {/* Measurements Summary & History */}
          <div className="space-y-6">
            {/* Current Measurements Cards */}
            {latestMeasurements ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Current Measurements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Neck", value: latestMeasurements.current.neck, change: latestMeasurements.changes?.neck },
                    { label: "Shoulders", value: latestMeasurements.current.shoulders, change: latestMeasurements.changes?.shoulders },
                    { label: "Chest", value: latestMeasurements.current.chest, change: latestMeasurements.changes?.chest },
                    { label: "Arms", value: latestMeasurements.current.arms, change: latestMeasurements.changes?.arms },
                    { label: "Forearms", value: latestMeasurements.current.forearms, change: latestMeasurements.changes?.forearms },
                    { label: "Waist", value: latestMeasurements.current.waist, change: latestMeasurements.changes?.waist },
                    { label: "Hips", value: latestMeasurements.current.hips, change: latestMeasurements.changes?.hips },
                    { label: "Glutes", value: latestMeasurements.current.glutes, change: latestMeasurements.changes?.glutes },
                    { label: "Thighs", value: latestMeasurements.current.legs, change: latestMeasurements.changes?.legs },
                    { label: "Calves", value: latestMeasurements.current.calves, change: latestMeasurements.changes?.calves },
                  ]
                    .filter((m) => m.value)
                    .map((measurement) => (
                      <div
                        key={measurement.label}
                        className="p-3 rounded-xl bg-background/50 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{measurement.label}</span>
                          {measurement.change !== null && measurement.change !== undefined && (
                            <div className={`flex items-center gap-0.5 text-xs ${
                              measurement.label === "Waist"
                                ? (measurement.change < 0 ? "text-green-500" : "text-red-500")
                                : (measurement.change > 0 ? "text-green-500" : "text-red-500")
                            }`}>
                              {measurement.change > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : measurement.change < 0 ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : null}
                              <span>{measurement.change > 0 ? "+" : ""}{measurement.change.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold">{measurement.value} cm</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Ruler className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No measurements recorded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Client can add measurements from their app
                </p>
              </div>
            )}

            {/* Measurement History */}
            {allMeasurements && allMeasurements.length > 1 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Recent History</h3>
                <div className="space-y-2">
                  {allMeasurements.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl ${
                        index === 0 ? "bg-primary/10 border border-primary/20" : "bg-background/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {entry.neck && <span>Neck: {entry.neck}cm</span>}
                        {entry.shoulders && <span>Shoulders: {entry.shoulders}cm</span>}
                        {entry.chest && <span>Chest: {entry.chest}cm</span>}
                        {entry.arms && <span>Arms: {entry.arms}cm</span>}
                        {entry.forearms && <span>Forearms: {entry.forearms}cm</span>}
                        {entry.waist && <span>Waist: {entry.waist}cm</span>}
                        {entry.hips && <span>Hips: {entry.hips}cm</span>}
                        {entry.glutes && <span>Glutes: {entry.glutes}cm</span>}
                        {entry.legs && <span>Thighs: {entry.legs}cm</span>}
                        {entry.calves && <span>Calves: {entry.calves}cm</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Photos */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Progress Photos</h2>
              <p className="text-sm text-muted-foreground">Visual transformation tracking</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="w-16 h-16 mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No progress photos uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Client can upload photos from their app
          </p>
        </div>
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
