import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { TrendingUp, TrendingDown, Camera, Plus, Flame } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MyProgress = () => {
  const { theme } = useTheme();

  // Mock weight data
  const weightData = [
    { date: "Jan 1", weight: 82 },
    { date: "Jan 8", weight: 81.5 },
    { date: "Jan 15", weight: 80.8 },
    { date: "Jan 22", weight: 80.2 },
    { date: "Jan 29", weight: 79.5 },
  ];

  const currentWeight = 79.5;
  const startWeight = 82;
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = ((weightChange / startWeight) * 100).toFixed(1);

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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Current Weight</span>
                {weightChange < 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{currentWeight}</span>
                <span className="text-muted-foreground">kg</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {weightChange < 0 ? "" : "+"}
                {weightChange} kg ({weightChangePercent}%)
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Workout Streak</span>
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">5</span>
                <span className="text-muted-foreground">days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Keep it up!</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Completion Rate</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">85</span>
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
            </div>
          </div>
        </div>

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
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Weight
                </Button>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weight Log History */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Recent Logs</h3>
              <div className="space-y-3">
                {weightData.reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                  >
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                    <span className="font-semibold">{entry.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Body Measurements</h2>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Measurement
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Chest", value: "98 cm", change: "+2 cm" },
                  { label: "Waist", value: "85 cm", change: "-3 cm" },
                  { label: "Hips", value: "95 cm", change: "-2 cm" },
                  { label: "Arms", value: "35 cm", change: "+1 cm" },
                  { label: "Legs", value: "60 cm", change: "+2 cm" },
                ].map((measurement) => (
                  <div
                    key={measurement.label}
                    className="p-4 rounded-xl bg-background/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {measurement.label}
                      </span>
                      <span className="text-xs text-primary">{measurement.change}</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{measurement.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Progress Photos</h2>
                <Button size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start documenting your transformation journey
                </p>
                <Button>
                  <Camera className="w-4 h-4 mr-2" />
                  Upload First Photo
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyProgress;
