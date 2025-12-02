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
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useClientLoadLab,
  LoadLabSummary,
  ACWRData,
} from "@/hooks/useClientLoadLab";
import { format } from "date-fns";

interface ClientLoadLabTabProps {
  clientId: string;
}

const ACWR_COLORS = {
  optimal: "#22c55e",
  caution: "#f59e0b",
  danger: "#ef4444",
  insufficient: "#6b7280",
};

const MUSCLE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export const ClientLoadLabTab = ({ clientId }: ClientLoadLabTabProps) => {
  const { data, isLoading, error } = useClientLoadLab(clientId, 56);
  const [showAcwrInfo, setShowAcwrInfo] = useState(false);

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
        <p className="text-red-500">Error loading load data</p>
      </div>
    );
  }

  const { dailyLoads, weeklyLoads, acwrData, summary, muscleGroupLoads } = data || {
    dailyLoads: [],
    weeklyLoads: [],
    acwrData: [],
    summary: null,
    muscleGroupLoads: [],
  };

  if (!summary || weeklyLoads.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">No Training Data Yet</h3>
        <p className="text-muted-foreground">
          This client needs more workout sessions to generate load analytics.
        </p>
      </div>
    );
  }

  const getACWRIcon = (zone: string) => {
    switch (zone) {
      case "optimal":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "caution":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "danger":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const summaryStats = [
    {
      icon: Scale,
      label: "Weekly Tonnage",
      value: `${(summary.currentWeekTonnage / 1000).toFixed(1)}t`,
      subValue: (
        <span
          className={
            summary.tonnageChange >= 0 ? "text-green-500" : "text-red-500"
          }
        >
          {summary.tonnageChange >= 0 ? "+" : ""}
          {summary.tonnageChange.toFixed(1)}% vs last week
        </span>
      ),
      color: "text-primary",
    },
    {
      icon: Activity,
      label: "Weekly Volume",
      value: `${summary.currentWeekVolume} reps`,
      subValue: `${summary.avgSessionsPerWeek.toFixed(1)} sessions/week avg`,
      color: "text-blue-500",
    },
    {
      icon: Target,
      label: "ACWR",
      value: summary.currentACWR.toFixed(2),
      subValue: (
        <Badge
          variant="outline"
          style={{
            backgroundColor: `${ACWR_COLORS[summary.acwrZone]}20`,
            color: ACWR_COLORS[summary.acwrZone],
            borderColor: `${ACWR_COLORS[summary.acwrZone]}50`,
          }}
        >
          {summary.acwrZone.charAt(0).toUpperCase() + summary.acwrZone.slice(1)}
        </Badge>
      ),
      color:
        summary.acwrZone === "optimal"
          ? "text-green-500"
          : summary.acwrZone === "caution"
          ? "text-yellow-500"
          : "text-red-500",
    },
    {
      icon: BarChart3,
      label: "30-Day Tonnage",
      value: `${(summary.totalTonnageLast30Days / 1000).toFixed(1)}t`,
      subValue: `${(summary.avgTonnagePerSession / 1000).toFixed(2)}t per session`,
      color: "text-purple-500",
    },
  ];

  // Prepare weekly tonnage chart data
  const weeklyTonnageData = weeklyLoads.map((w) => ({
    week: `W${w.weekNumber}`,
    tonnage: Math.round(w.tonnage / 1000),
    volume: w.volume,
    sessions: w.sessionCount,
  }));

  // Prepare ACWR trend data
  const acwrTrendData = acwrData.slice(-30).map((a) => ({
    date: format(new Date(a.date), "MMM d"),
    acwr: a.acwr,
    zone: a.zone,
  }));

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
            <div className="text-xs text-muted-foreground mt-1">
              {stat.subValue}
            </div>
          </div>
        ))}
      </div>

      {/* ACWR Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Acute:Chronic Workload Ratio
              </h2>
              <p className="text-sm text-muted-foreground">
                Training load management indicator
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAcwrInfo(!showAcwrInfo)}
          >
            {showAcwrInfo ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showAcwrInfo ? "Hide Info" : "What is ACWR?"}
          </Button>
        </div>

        {showAcwrInfo && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">
              Understanding ACWR
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>ACWR</strong> = Acute Load (7 days) / Chronic Load (28
                days avg)
              </li>
              <li>
                <span className="text-green-500 font-medium">0.8-1.3:</span>{" "}
                Optimal training zone - progressive overload
              </li>
              <li>
                <span className="text-yellow-500 font-medium">
                  0.5-0.8 or 1.3-1.5:
                </span>{" "}
                Caution zone - monitor recovery
              </li>
              <li>
                <span className="text-red-500 font-medium">&lt;0.5 or &gt;1.5:</span>{" "}
                Danger zone - injury risk elevated
              </li>
            </ul>
          </div>
        )}

        {acwrTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={acwrTrendData}>
              <defs>
                <linearGradient id="acwrGradient" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 2]}
              />
              <ReferenceLine
                y={0.8}
                stroke="#22c55e"
                strokeDasharray="5 5"
                label={{ value: "0.8", position: "right", fontSize: 10 }}
              />
              <ReferenceLine
                y={1.3}
                stroke="#22c55e"
                strokeDasharray="5 5"
                label={{ value: "1.3", position: "right", fontSize: 10 }}
              />
              <ReferenceLine
                y={1.5}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: "1.5", position: "right", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value.toFixed(2), "ACWR"]}
              />
              <Area
                type="monotone"
                dataKey="acwr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#acwrGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Need 4+ weeks of data to calculate ACWR
          </div>
        )}

        {/* ACWR Zone Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {Object.entries(ACWR_COLORS).map(([zone, color]) => (
            <div key={zone} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {zone}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Tonnage Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Weekly Tonnage</h2>
            <p className="text-sm text-muted-foreground">
              Total weight lifted per week (tonnes)
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyTonnageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="week"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(v) => `${v}t`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                name === "tonnage" ? `${value}t` : value,
                name === "tonnage" ? "Tonnage" : name === "volume" ? "Reps" : "Sessions",
              ]}
            />
            <Bar
              dataKey="tonnage"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Muscle Group Distribution */}
      {muscleGroupLoads.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Volume Distribution</h2>
              <p className="text-sm text-muted-foreground">
                Tonnage by muscle group (last 8 weeks)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie
                    data={muscleGroupLoads.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="percentage"
                    nameKey="muscleGroup"
                  >
                    {muscleGroupLoads.slice(0, 8).map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={MUSCLE_COLORS[i % MUSCLE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with details */}
            <div className="space-y-3">
              {muscleGroupLoads.slice(0, 8).map((mg, i) => (
                <div
                  key={mg.muscleGroup}
                  className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: MUSCLE_COLORS[i % MUSCLE_COLORS.length],
                      }}
                    />
                    <span className="font-medium">{mg.muscleGroup}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {(mg.tonnage / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mg.sets} sets · {mg.volume} reps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Load Heatmap-style display */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Daily Load</h2>
            <p className="text-sm text-muted-foreground">
              Training tonnage per day (last 4 weeks)
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyLoads.slice(-28)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(v) => format(new Date(v), "d")}
              interval={6}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}t`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
              formatter={(value: number) => [
                `${(value / 1000).toFixed(2)}t`,
                "Tonnage",
              ]}
            />
            <Bar dataKey="tonnage" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Training Load Tips */}
      <div className="glass rounded-2xl p-6 bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">
              Load Management Tips
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Progressive Overload:</strong> Aim for 5-10% weekly
                tonnage increases
              </li>
              <li>
                <strong>Deload Weeks:</strong> Every 4-6 weeks, reduce load by
                40-50%
              </li>
              <li>
                <strong>Balance:</strong> Ensure opposing muscle groups receive
                similar volume
              </li>
              <li>
                <strong>Recovery:</strong> Monitor ACWR to prevent overtraining
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};