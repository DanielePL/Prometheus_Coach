import { useState } from "react";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Activity,
  Utensils,
  Zap,
  Target,
  Minus,
  Sparkles,
  Calendar,
  Dumbbell,
  Clock,
  Flame,
  Award,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  useClientInsights,
  ClientInsight,
  InsightType,
  InsightCategory,
} from "@/hooks/useClientInsights";

interface ClientInsightsTabProps {
  clientId: string;
}

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case "strength_gain":
      return TrendingUp;
    case "consistency":
      return CheckCircle;
    case "recovery":
      return Activity;
    case "nutrition":
      return Utensils;
    case "volume":
      return Target;
    case "velocity":
      return Zap;
    case "recommendation":
      return Lightbulb;
    case "warning":
      return AlertTriangle;
    case "celebration":
      return Trophy;
    case "pr":
      return Award;
    case "pattern":
      return Calendar;
    default:
      return Lightbulb;
  }
};

const getInsightColor = (type: InsightType, priority: string) => {
  if (type === "warning") return "text-yellow-500";
  if (type === "celebration") return "text-yellow-500";
  if (priority === "high") return "text-red-500";
  if (type === "recommendation") return "text-blue-500";
  if (type === "pr") return "text-purple-500";
  return "text-green-500";
};

const getCategoryColor = (category: InsightCategory) => {
  switch (category) {
    case "training":
      return "bg-blue-500/10 text-blue-500 border-blue-500/50";
    case "nutrition":
      return "bg-green-500/10 text-green-500 border-green-500/50";
    case "recovery":
      return "bg-orange-500/10 text-orange-500 border-orange-500/50";
    case "progress":
      return "bg-purple-500/10 text-purple-500 border-purple-500/50";
    case "behavior":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/50";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/50";
  }
};

const getTrendIcon = (trend?: "up" | "down" | "stable") => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export const ClientInsightsTab = ({ clientId }: ClientInsightsTabProps) => {
  const { data, isLoading, error } = useClientInsights(clientId);
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | "all">("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-500">Error loading insights</p>
      </div>
    );
  }

  const { insights, summary } = data || { insights: [], summary: null };

  if (!summary) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">Keine Insights verfügbar</h3>
        <p className="text-muted-foreground">
          Mehr Trainingsdaten werden benötigt, um Insights zu generieren.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return "from-green-500 to-emerald-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Exzellent";
    if (score >= 60) return "Gut";
    if (score >= 40) return "Verbesserungspotenzial";
    return "Kritisch";
  };

  // Radar chart data for category scores
  const radarData = [
    { subject: "Training", value: summary.trainingScore, fullMark: 100 },
    { subject: "Konsistenz", value: summary.consistencyScore, fullMark: 100 },
    { subject: "Fortschritt", value: summary.progressScore, fullMark: 100 },
    { subject: "Ernährung", value: summary.nutritionScore, fullMark: 100 },
  ];

  // Filter insights by category
  const filteredInsights = categoryFilter === "all"
    ? insights
    : insights.filter(i => i.category === categoryFilter);

  const categories: { value: InsightCategory | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "training", label: "Training" },
    { value: "behavior", label: "Verhalten" },
    { value: "recovery", label: "Erholung" },
    { value: "progress", label: "Fortschritt" },
    { value: "nutrition", label: "Ernährung" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Workouts</span>
          </div>
          <p className="text-2xl font-bold">{summary.quickStats.totalWorkouts}</p>
          <p className="text-xs text-muted-foreground">letzte 8 Wochen</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Pro Woche</span>
          </div>
          <p className="text-2xl font-bold">{summary.quickStats.avgPerWeek.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Durchschnitt</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Volumen</span>
          </div>
          <p className="text-2xl font-bold">
            {summary.quickStats.totalVolume >= 1000
              ? `${(summary.quickStats.totalVolume / 1000).toFixed(0)}k`
              : summary.quickStats.totalVolume}
          </p>
          <p className="text-xs text-muted-foreground">kg total</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">PRs</span>
          </div>
          <p className="text-2xl font-bold">{summary.quickStats.prsThisMonth}</p>
          <p className="text-xs text-muted-foreground">diesen Monat</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-2xl font-bold">{summary.quickStats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">aktuell</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Bester Streak</span>
          </div>
          <p className="text-2xl font-bold">{summary.quickStats.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Workouts</p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Gesamt-Score</h3>
              <p className="text-xs text-muted-foreground">Performance-Bewertung</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreGradient(summary.overallScore)} bg-clip-text text-transparent`}>
              {summary.overallScore}
            </div>
            <Progress value={summary.overallScore} className="h-2 w-full mt-4" />
            <p className={`text-sm mt-2 ${getScoreColor(summary.overallScore)}`}>
              {getScoreLabel(summary.overallScore)}
            </p>
          </div>

          {/* Category Bars */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Training</span>
              <span className="font-semibold">{summary.trainingScore}</span>
            </div>
            <Progress value={summary.trainingScore} className="h-1.5" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Konsistenz</span>
              <span className="font-semibold">{summary.consistencyScore}</span>
            </div>
            <Progress value={summary.consistencyScore} className="h-1.5" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-semibold">{summary.progressScore}</span>
            </div>
            <Progress value={summary.progressScore} className="h-1.5" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ernährung</span>
              <span className="font-semibold">{summary.nutritionScore}</span>
            </div>
            <Progress value={summary.nutritionScore} className="h-1.5" />
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths & Areas */}
        <div className="space-y-4">
          {/* Strengths */}
          <div className="glass rounded-xl p-4 bg-green-500/5 border border-green-500/20">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Stärken
            </h4>
            {summary.strengths.length > 0 ? (
              <ul className="text-sm space-y-2">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Mehr Daten benötigt</p>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="glass rounded-xl p-4 bg-yellow-500/5 border border-yellow-500/20">
            <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Fokus-Bereiche
            </h4>
            {summary.areasToImprove.length > 0 ? (
              <ul className="text-sm space-y-2">
                {summary.areasToImprove.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">!</span>
                    <span className="text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Alles sieht gut aus!</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      {summary.weeklyTrend && summary.weeklyTrend.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Wochen-Trend</h3>
              <p className="text-sm text-muted-foreground">Sessions & Volumen der letzten 8 Wochen</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={summary.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="weekStart"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "volume") return [`${value.toLocaleString()} kg`, "Volumen"];
                  if (name === "sessions") return [value, "Sessions"];
                  if (name === "prs") return [value, "PRs"];
                  return [value, name];
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="sessions"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="sessions"
              />
              <Bar
                yAxisId="right"
                dataKey="volume"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                radius={[4, 4, 0, 0]}
                name="volume"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Training Pattern */}
      {summary.trainingPattern && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Training-Muster</h3>
              <p className="text-sm text-muted-foreground">Erkannte Trainingsgewohnheiten</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Bevorzugte Tage</p>
              <p className="font-semibold">
                {summary.trainingPattern.preferredDays.slice(0, 2).join(", ")}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Ø Session-Dauer</p>
              <p className="font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {summary.trainingPattern.avgSessionDuration} min
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Ø Ruhetage</p>
              <p className="font-semibold">{summary.trainingPattern.avgRestDays} Tage</p>
            </div>

            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Fokus-Muskeln</p>
              <p className="font-semibold text-sm">
                {summary.trainingPattern.mostTrainedMuscles.slice(0, 2).map(m => m.muscle).join(", ") || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Insight Highlight */}
      {summary.topInsight && (
        <div
          className={`glass rounded-2xl p-6 ${
            summary.topInsight.type === "warning"
              ? "bg-yellow-500/5 border border-yellow-500/20"
              : summary.topInsight.type === "celebration"
              ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
              : "bg-primary/5 border border-primary/20"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                summary.topInsight.type === "warning"
                  ? "bg-yellow-500/20"
                  : summary.topInsight.type === "celebration"
                  ? "bg-yellow-500/20"
                  : "bg-primary/20"
              }`}
            >
              {(() => {
                const Icon = getInsightIcon(summary.topInsight.type);
                return (
                  <Icon
                    className={`w-6 h-6 ${getInsightColor(
                      summary.topInsight.type,
                      summary.topInsight.priority
                    )}`}
                  />
                );
              })()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-lg">{summary.topInsight.title}</h3>
                <Badge variant="outline" className={getCategoryColor(summary.topInsight.category)}>
                  {summary.topInsight.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    summary.topInsight.priority === "high"
                      ? "bg-red-500/10 text-red-500 border-red-500/50"
                      : summary.topInsight.priority === "medium"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                      : "bg-green-500/10 text-green-500 border-green-500/50"
                  }
                >
                  {summary.topInsight.priority === "high" ? "Hoch" : summary.topInsight.priority === "medium" ? "Mittel" : "Niedrig"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{summary.topInsight.description}</p>
              {summary.topInsight.metric && (
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(summary.topInsight.trend)}
                  <span className="text-sm font-medium">{summary.topInsight.metric}</span>
                </div>
              )}
              {summary.topInsight.actionable && (
                <div className="mt-3 p-3 rounded-lg bg-background/50">
                  <p className="text-sm">
                    <span className="font-medium">💡 Empfehlung:</span>{" "}
                    {summary.topInsight.actionable}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Insights */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Alle Insights</h3>
              <p className="text-sm text-muted-foreground">
                {filteredInsights.length} von {insights.length} Insights
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                  className="text-xs h-7"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredInsights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      insight.type === "warning"
                        ? "bg-yellow-500/10"
                        : insight.type === "celebration"
                        ? "bg-yellow-500/10"
                        : insight.type === "recommendation"
                        ? "bg-blue-500/10"
                        : insight.type === "pr"
                        ? "bg-purple-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${getInsightColor(insight.type, insight.priority)}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(insight.category)}`}>
                          {insight.category}
                        </Badge>
                      </div>
                      {insight.metric && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(insight.trend)}
                          <span className="text-sm text-muted-foreground">
                            {insight.metric}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    {insight.actionable && (
                      <p className="text-sm text-primary mt-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {insight.actionable}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredInsights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Insights in dieser Kategorie
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
