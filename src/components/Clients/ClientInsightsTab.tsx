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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useClientInsights,
  ClientInsight,
  InsightType,
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
    default:
      return Lightbulb;
  }
};

const getInsightColor = (type: InsightType, priority: string) => {
  if (type === "warning") return "text-yellow-500";
  if (type === "celebration") return "text-yellow-500";
  if (priority === "high") return "text-red-500";
  if (type === "recommendation") return "text-blue-500";
  return "text-green-500";
};

const getTrendIcon = (trend?: "up" | "down" | "stable") => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export const ClientInsightsTab = ({ clientId }: ClientInsightsTabProps) => {
  const { data, isLoading, error } = useClientInsights(clientId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
        <h3 className="text-xl font-bold mb-2">No Insights Available</h3>
        <p className="text-muted-foreground">
          More training data is needed to generate insights.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Attention";
    return "Critical";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Insights</h2>
            <p className="text-sm text-muted-foreground">
              Automated analysis of training data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score */}
          <div className="flex flex-col items-center p-4 rounded-xl bg-background/50">
            <div
              className={`text-5xl font-bold ${getScoreColor(summary.overallScore)}`}
            >
              {summary.overallScore}
            </div>
            <Progress
              value={summary.overallScore}
              className="h-2 w-full mt-3"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {getScoreLabel(summary.overallScore)}
            </p>
          </div>

          {/* Strengths */}
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Strengths
            </h4>
            {summary.strengths.length > 0 ? (
              <ul className="text-sm space-y-1">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                More data needed
              </p>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Focus Areas
            </h4>
            {summary.areasToImprove.length > 0 ? (
              <ul className="text-sm space-y-1">
                {summary.areasToImprove.map((a, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Everything looks good!
              </p>
            )}
          </div>
        </div>
      </div>

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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">
                  {summary.topInsight.title}
                </h3>
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
                  {summary.topInsight.priority} priority
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {summary.topInsight.description}
              </p>
              {summary.topInsight.metric && (
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(summary.topInsight.trend)}
                  <span className="text-sm font-medium">
                    {summary.topInsight.metric}
                  </span>
                </div>
              )}
              {summary.topInsight.actionable && (
                <div className="mt-3 p-3 rounded-lg bg-background/50">
                  <p className="text-sm">
                    <span className="font-medium">Suggestion:</span>{" "}
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">All Insights</h2>
            <p className="text-sm text-muted-foreground">
              {insights.length} insights generated
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-background/50 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      insight.type === "warning"
                        ? "bg-yellow-500/10"
                        : insight.type === "celebration"
                        ? "bg-yellow-500/10"
                        : insight.type === "recommendation"
                        ? "bg-blue-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${getInsightColor(
                        insight.type,
                        insight.priority
                      )}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{insight.title}</h4>
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
                      <p className="text-sm text-primary mt-2">
                        {insight.actionable}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No insights available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
