import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Scale, Trophy, Ruler, TrendingUp, TrendingDown, Camera, Target, Calendar, Minus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useClientPersonalRecords } from "@/hooks/usePersonalRecords";
import { useClientLatestMeasurements, useClientBodyMeasurements } from "@/hooks/useBodyMeasurements";
import { useClientProgressPhotos } from "@/hooks/useProgressPhotos";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ClientProgressTabProps {
  clientId: string;
}

export const ClientProgressTab = ({ clientId }: ClientProgressTabProps) => {
  const { data: weightLogs, isLoading: weightLoading } = useWeightLogs(clientId);
  const { data: personalRecords, isLoading: prLoading } = useClientPersonalRecords(clientId);
  const { data: latestMeasurements, isLoading: measurementsLoading } = useClientLatestMeasurements(clientId);
  const { data: allMeasurements } = useClientBodyMeasurements(clientId);
  const { data: progressPhotos, isLoading: photosLoading } = useClientProgressPhotos(clientId);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [measurementView, setMeasurementView] = useState<"cards" | "chart">("cards");

  const isLoading = weightLoading || prLoading || measurementsLoading || photosLoading;

  // Weight chart data
  const weightChartData = weightLogs?.slice().reverse().map((log) => ({
    date: format(parseISO(log.date), "MMM d"),
    weight: Number(log.weight),
    fullDate: log.date,
  })) || [];

  // Weight stats
  const weightStats = weightLogs && weightLogs.length > 0 ? {
    current: Number(weightLogs[0].weight),
    start: Number(weightLogs[weightLogs.length - 1].weight),
    change: Number(weightLogs[0].weight) - Number(weightLogs[weightLogs.length - 1].weight),
    lowest: Math.min(...weightLogs.map(l => Number(l.weight))),
    highest: Math.max(...weightLogs.map(l => Number(l.weight))),
  } : null;

  // Measurement chart data
  const measurementChartData = allMeasurements?.slice().reverse().map((m) => ({
    date: format(parseISO(m.date), "MMM d"),
    chest: m.chest,
    waist: m.waist,
    arms: m.arms,
    legs: m.legs,
  })) || [];

  // Calculate 1RM (Epley formula)
  const calculate1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  // Group photos by type
  const photosByType = {
    before: progressPhotos?.filter(p => p.type === "before") || [],
    progress: progressPhotos?.filter(p => p.type === "progress") || [],
    after: progressPhotos?.filter(p => p.type === "after") || [],
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weight Section */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Weight Tracking</h2>
            <p className="text-sm text-muted-foreground">
              {weightLogs && weightLogs.length > 0
                ? `${weightLogs.length} entries recorded`
                : "No entries yet"}
            </p>
          </div>
        </div>

        {weightStats ? (
          <>
            {/* Weight Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Target className="w-3 h-3" />
                  Current
                </div>
                <p className="text-2xl font-bold">{weightStats.current} kg</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                  Starting
                </div>
                <p className="text-2xl font-bold">{weightStats.start} kg</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Change</div>
                <div className={`flex items-center gap-1 text-2xl font-bold ${
                  weightStats.change < 0 ? "text-green-500" : weightStats.change > 0 ? "text-red-500" : ""
                }`}>
                  {weightStats.change > 0 ? <TrendingUp className="w-5 h-5" /> :
                   weightStats.change < 0 ? <TrendingDown className="w-5 h-5" /> :
                   <Minus className="w-5 h-5" />}
                  {weightStats.change > 0 ? "+" : ""}{weightStats.change.toFixed(1)} kg
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Range</div>
                <p className="text-lg font-bold">{weightStats.lowest} - {weightStats.highest} kg</p>
              </div>
            </div>

            {/* Weight Chart */}
            {weightChartData.length > 1 && (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} kg`, "Weight"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#weightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No weight data to display
          </div>
        )}
      </div>

      {/* Body Measurements */}
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
                  ? `Last updated ${format(parseISO(latestMeasurements.lastUpdated), "MMM d, yyyy")}`
                  : "No measurements yet"}
              </p>
            </div>
          </div>
          {latestMeasurements && allMeasurements && allMeasurements.length > 1 && (
            <Tabs value={measurementView} onValueChange={(v) => setMeasurementView(v as "cards" | "chart")}>
              <TabsList className="grid grid-cols-2 w-[160px]">
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {latestMeasurements ? (
          <div className="space-y-6">
            {measurementView === "cards" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                      className="p-4 rounded-xl bg-background/50 border border-border/50"
                    >
                      <span className="text-xs text-muted-foreground">{measurement.label}</span>
                      <p className="text-xl font-bold mt-1">{measurement.value} cm</p>
                      {measurement.change !== null && measurement.change !== undefined && (
                        <div className={`flex items-center gap-1 text-xs mt-1 ${
                          measurement.label === "Waist"
                            ? (measurement.change < 0 ? "text-green-500" : "text-red-500")
                            : (measurement.change > 0 ? "text-green-500" : "text-red-500")
                        }`}>
                          {measurement.change > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : measurement.change < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          <span>{measurement.change > 0 ? "+" : ""}{measurement.change.toFixed(1)} cm</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={measurementChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="chest" stroke="#f97316" strokeWidth={2} name="Chest" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="waist" stroke="#22c55e" strokeWidth={2} name="Waist" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="arms" stroke="#3b82f6" strokeWidth={2} name="Arms" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="legs" stroke="#a855f7" strokeWidth={2} name="Thighs" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Measurement History */}
            {allMeasurements && allMeasurements.length > 1 && measurementView === "cards" && (
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
                          {format(parseISO(entry.date), "MMM d, yyyy")}
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
        ) : (
          <div className="text-center py-12">
            <Ruler className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No measurements recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Client can add measurements from their app
            </p>
          </div>
        )}
      </div>

      {/* Progress Photos */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Progress Photos</h2>
            <p className="text-sm text-muted-foreground">
              {progressPhotos && progressPhotos.length > 0
                ? `${progressPhotos.length} photos uploaded`
                : "No photos yet"}
            </p>
          </div>
        </div>

        {progressPhotos && progressPhotos.length > 0 ? (
          <div className="space-y-6">
            {/* Before/After Comparison */}
            {photosByType.before.length > 0 && photosByType.after.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Before & After</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Before</p>
                    <img
                      src={photosByType.before[0].photo_url}
                      alt="Before"
                      className="w-full aspect-[3/4] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedPhotoIndex(progressPhotos.findIndex(p => p.id === photosByType.before[0].id))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(photosByType.before[0].date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">After</p>
                    <img
                      src={photosByType.after[photosByType.after.length - 1].photo_url}
                      alt="After"
                      className="w-full aspect-[3/4] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedPhotoIndex(progressPhotos.findIndex(p => p.id === photosByType.after[photosByType.after.length - 1].id))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(photosByType.after[photosByType.after.length - 1].date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Photos Grid */}
            <div>
              <h3 className="font-semibold mb-3">All Photos</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {progressPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt={`Progress ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedPhotoIndex(index)}
                    />
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-black/60 text-white border-0 w-full justify-center"
                      >
                        {format(parseISO(photo.date), "MMM d")}
                      </Badge>
                    </div>
                    {photo.type && (
                      <Badge
                        className={`absolute top-1 right-1 text-[10px] ${
                          photo.type === "before" ? "bg-blue-500" :
                          photo.type === "after" ? "bg-green-500" :
                          "bg-primary"
                        }`}
                      >
                        {photo.type}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No progress photos uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Client can upload photos from their app
            </p>
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
          {selectedPhotoIndex !== null && progressPhotos && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedPhotoIndex(null)}
              >
                <X className="w-6 h-6" />
              </Button>

              <img
                src={progressPhotos[selectedPhotoIndex].photo_url}
                alt="Progress"
                className="w-full max-h-[80vh] object-contain"
              />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                  disabled={selectedPhotoIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm">
                  {format(parseISO(progressPhotos[selectedPhotoIndex].date), "MMM d, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedPhotoIndex(Math.min(progressPhotos.length - 1, selectedPhotoIndex + 1))}
                  disabled={selectedPhotoIndex === progressPhotos.length - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Personal Records */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
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
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{pr.exercises?.title || "Unknown Exercise"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(pr.achieved_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white mb-1">
                    <Trophy className="w-3 h-3 mr-1" />
                    {pr.weight_used} kg x {pr.reps_completed}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Est. 1RM: {calculate1RM(pr.weight_used, pr.reps_completed)} kg
                  </p>
                </div>
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
