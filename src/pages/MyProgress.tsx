import { useState } from "react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { TrendingUp, TrendingDown, Camera, Plus, Flame, Dumbbell, Clock, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useWeightLogs, useLatestWeight } from "@/hooks/useWeightLogs";
import { useLatestMeasurements } from "@/hooks/useBodyMeasurements";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import {
  useWorkoutStreak,
  useMonthlyCompletionRate,
  useTotalWorkoutTime,
  useMostPerformedExercises,
  useVolumeProgression,
} from "@/hooks/useWorkoutAnalytics";
import { LogWeightDialog } from "@/components/Progress/LogWeightDialog";
import { LogMeasurementDialog } from "@/components/Progress/LogMeasurementDialog";
import { UploadPhotoDialog } from "@/components/Progress/UploadPhotoDialog";

const MyProgress = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [logMeasurementOpen, setLogMeasurementOpen] = useState(false);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);

  // Data queries
  const { data: weightLogs } = useWeightLogs(user?.id || "");
  const { data: latestWeight } = useLatestWeight();
  const { data: latestMeasurements } = useLatestMeasurements();
  const { data: progressPhotos } = useProgressPhotos();
  const { data: workoutStreak } = useWorkoutStreak();
  const { data: completionRate } = useMonthlyCompletionRate();
  const { data: totalTime } = useTotalWorkoutTime();
  const { data: topExercises } = useMostPerformedExercises();
  const { data: volumeData } = useVolumeProgression();

  // Transform weight logs for chart
  const weightData = weightLogs?.map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: log.weight,
  })) || [];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">My Progress</h1>
              <p className="text-muted-foreground">Track your fitness journey</p>
            </div>
          </div>

          {/* Quick Stats - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Weight Card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Current Weight</span>
                {latestWeight && latestWeight.change < 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-primary" />
                )}
              </div>
              {latestWeight ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{latestWeight.current}</span>
                    <span className="text-muted-foreground">kg</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {latestWeight.change < 0 ? "" : "+"}
                    {latestWeight.change.toFixed(1)} kg ({latestWeight.changePercent}%)
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-muted-foreground">No weight logged yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLogWeightOpen(true)}
                    className="mt-2"
                  >
                    Log your first weight
                  </Button>
                </div>
              )}
            </div>

            {/* Workout Streak Card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Workout Streak</span>
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{workoutStreak || 0}</span>
                <span className="text-muted-foreground">days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {workoutStreak && workoutStreak > 0 ? "Keep it up!" : "Start your streak!"}
              </p>
            </div>

            {/* Completion Rate Card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Completion Rate</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{completionRate || 0}</span>
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
            </div>
          </div>

          {/* Additional Analytics - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Total Workout Time */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Workout Time</span>
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{totalTime?.hours || 0}</span>
                <span className="text-muted-foreground">hours</span>
                <span className="text-2xl font-bold ml-2">{totalTime?.minutes || 0}</span>
                <span className="text-muted-foreground">min</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">All time</p>
            </div>

            {/* Average Session Duration */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Avg Session</span>
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {totalTime && totalTime.totalSeconds > 0 
                    ? Math.round(totalTime.totalSeconds / 60 / (completionRate || 1))
                    : 0}
                </span>
                <span className="text-muted-foreground">min</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Per workout</p>
            </div>
          </div>
        </div>

        {/* Most Performed Exercises */}
        {topExercises && topExercises.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Top Exercises</h2>
            </div>
            <div className="space-y-3">
              {topExercises.map((exercise, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                    {exercise.thumbnail && (
                      <img
                        src={exercise.thumbnail}
                        alt={exercise.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <span className="font-semibold">{exercise.title}</span>
                  </div>
                  <span className="text-muted-foreground">{exercise.count} sets</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volume Progression Chart */}
        {volumeData && volumeData.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">Volume Progression</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="weight" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Weight Tab */}
          <TabsContent value="weight" className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Weight Tracking</h2>
                <Button size="sm" onClick={() => setLogWeightOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Weight
                </Button>
              </div>

              {weightData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: "12px" }}
                        domain={["dataMin - 1", "dataMax + 1"]}
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
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No weight entries yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start tracking your weight to see your progress over time
                  </p>
                  <Button onClick={() => setLogWeightOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your First Weight
                  </Button>
                </div>
              )}
            </div>

            {/* Weight Log History */}
            {weightLogs && weightLogs.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Recent Logs</h3>
                <div className="space-y-3">
                  {[...weightLogs].reverse().slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <div className="text-right">
                        <p className="font-semibold">{entry.weight} kg</p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Body Measurements</h2>
                <Button size="sm" onClick={() => setLogMeasurementOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Measurement
                </Button>
              </div>

              {latestMeasurements ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Chest", value: latestMeasurements.current.chest, change: latestMeasurements.changes?.chest },
                    { label: "Waist", value: latestMeasurements.current.waist, change: latestMeasurements.changes?.waist },
                    { label: "Hips", value: latestMeasurements.current.hips, change: latestMeasurements.changes?.hips },
                    { label: "Arms", value: latestMeasurements.current.arms, change: latestMeasurements.changes?.arms },
                    { label: "Legs", value: latestMeasurements.current.legs, change: latestMeasurements.changes?.legs },
                  ]
                    .filter((m) => m.value)
                    .map((measurement) => (
                      <div key={measurement.label} className="p-4 rounded-xl bg-background/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{measurement.label}</span>
                          {measurement.change !== null && measurement.change !== undefined && (
                            <span
                              className={`text-xs ${
                                measurement.change > 0 ? "text-primary" : "text-green-500"
                              }`}
                            >
                              {measurement.change > 0 ? "+" : ""}
                              {measurement.change.toFixed(1)} cm
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold mt-2">{measurement.value} cm</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No measurements yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Track your body measurements to see changes over time
                  </p>
                  <Button onClick={() => setLogMeasurementOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Measurement
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Progress Photos</h2>
                <Button size="sm" onClick={() => setUploadPhotoOpen(true)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {progressPhotos && progressPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {progressPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-xl overflow-hidden aspect-square"
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Progress photo from ${photo.date}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                        <p className="text-sm font-semibold">
                          {new Date(photo.date).toLocaleDateString()}
                        </p>
                        {photo.type && (
                          <p className="text-xs text-white/80 capitalize">{photo.type}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start documenting your transformation journey
                  </p>
                  <Button onClick={() => setUploadPhotoOpen(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Upload First Photo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <LogWeightDialog open={logWeightOpen} onOpenChange={setLogWeightOpen} />
      <LogMeasurementDialog open={logMeasurementOpen} onOpenChange={setLogMeasurementOpen} />
      <UploadPhotoDialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen} />
    </div>
  );
};

export default MyProgress;
