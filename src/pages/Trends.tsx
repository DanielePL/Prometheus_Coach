import { useTheme } from "next-themes";
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
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Dumbbell,
  Activity,
  AlertCircle,
  Crown,
  Utensils,
  BarChart3,
} from "lucide-react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCoachTrends } from "@/hooks/useCoachTrends";
import { useAuth } from "@/contexts/AuthContext";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { format } from "date-fns";

const Trends = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { data, isLoading, error } = useCoachTrends(user?.id || "", 30);

  if (isLoading) {
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
          <h1 className="text-3xl font-bold mb-6">Trends Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </main>
      </div>
    );
  }

  if (error) {
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
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-red-500">Error loading trends data</p>
          </div>
        </main>
      </div>
    );
  }

  const { clientEngagements, dailyActivity, weeklySummaries, summary } = data || {
    clientEngagements: [],
    dailyActivity: [],
    weeklySummaries: [],
    summary: null,
  };

  if (!summary) {
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
          <h1 className="text-3xl font-bold mb-6">Trends Dashboard</h1>
          <div className="glass rounded-2xl p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground">
              Connect with clients and have them start training to see trends.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const summaryStats = [
    {
      icon: Users,
      label: "Active Clients",
      value: summary.totalActiveClients,
      subValue: `${clientEngagements.length} total`,
      color: "text-primary",
    },
    {
      icon: Dumbbell,
      label: "Avg Workouts/Week",
      value: summary.avgWorkoutsThisWeek.toFixed(1),
      subValue: (
        <span
          className={
            summary.workoutTrend >= 0 ? "text-green-500" : "text-red-500"
          }
        >
          {summary.workoutTrend >= 0 ? (
            <TrendingUp className="w-3 h-3 inline mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 inline mr-1" />
          )}
          {Math.abs(summary.workoutTrend).toFixed(0)}% vs last week
        </span>
      ),
      color: "text-blue-500",
    },
    {
      icon: Activity,
      label: "Sets This Week",
      value: summary.totalSetsThisWeek.toLocaleString(),
      subValue: "Across all clients",
      color: "text-green-500",
    },
    {
      icon: AlertCircle,
      label: "Need Attention",
      value: summary.clientsNeedingAttention,
      subValue: "Low engagement",
      color:
        summary.clientsNeedingAttention > 0 ? "text-yellow-500" : "text-green-500",
    },
  ];

  // Prepare chart data
  const activityChartData = dailyActivity.slice(-14).map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    workouts: d.workouts,
    clients: d.activeClients,
  }));

  const weeklyChartData = weeklySummaries.map((w, i) => ({
    week: `W${i + 1}`,
    workouts: w.totalWorkouts,
    sets: Math.round(w.totalSets / 100), // Scale down for chart
    clients: w.activeClientCount,
  }));

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Trends Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all client activity and engagement
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
              <div className="text-xs text-muted-foreground mt-1">
                {stat.subValue}
              </div>
            </div>
          ))}
        </div>

        {/* Most Active Client Card */}
        {summary.mostActiveClient && (
          <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Active Client</p>
                <h3 className="text-xl font-bold">{summary.mostActiveClient.name}</h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {summary.mostActiveClient.workouts} workouts this month
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Activity Chart */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Daily Activity</h2>
                <p className="text-sm text-muted-foreground">Last 14 days</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityChartData}>
                <defs>
                  <linearGradient id="workoutsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="workouts"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#workoutsGradient)"
                  name="Workouts"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Summary Chart */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Weekly Summary</h2>
                <p className="text-sm text-muted-foreground">
                  Workouts per week
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="workouts"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Workouts"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Engagement Leaderboard */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Client Engagement</h2>
              <p className="text-sm text-muted-foreground">
                Ranked by engagement score
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {clientEngagements.map((client, i) => (
              <div
                key={client.clientId}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
              >
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
                    <h4 className="font-semibold">{client.clientName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {client.workoutsCompleted} workouts ·{" "}
                      {client.totalSets} sets ·{" "}
                      {client.daysActive} active days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 hidden md:block">
                    <Progress
                      value={client.engagementScore}
                      className="h-2"
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      client.engagementScore >= 70
                        ? "bg-green-500/10 text-green-500 border-green-500/50"
                        : client.engagementScore >= 40
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                        : "bg-red-500/10 text-red-500 border-red-500/50"
                    }
                  >
                    {client.engagementScore}%
                  </Badge>
                </div>
              </div>
            ))}

            {clientEngagements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No client data available
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trends;