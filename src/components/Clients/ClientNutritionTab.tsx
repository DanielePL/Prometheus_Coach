import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Utensils,
  Target,
  TrendingUp,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  Settings,
  Calendar,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useClientNutrition,
  useClientNutritionWeekly,
  useSetClientNutritionGoal,
  GoalType,
  DailyNutritionSummary,
} from "@/hooks/useClientNutrition";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClientNutritionTabProps {
  clientId: string;
}

const MACRO_COLORS = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fat: "#f59e0b",
};

export const ClientNutritionTab = ({ clientId }: ClientNutritionTabProps) => {
  const { data, isLoading, error } = useClientNutrition(clientId, 30);
  const { data: weeklyData, isLoading: weeklyLoading } =
    useClientNutritionWeekly(clientId);
  const setGoalMutation = useSetClientNutritionGoal();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: "maintenance" as GoalType,
    targetCalories: 2500,
    targetProtein: 180,
    targetCarbs: 250,
    targetFat: 80,
  });

  const handleSetGoal = async () => {
    try {
      await setGoalMutation.mutateAsync({
        clientId,
        ...newGoal,
      });
      toast.success("Nutrition goals updated successfully");
      setGoalDialogOpen(false);
    } catch (e) {
      toast.error("Failed to set nutrition goals");
    }
  };

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
        <p className="text-red-500">Error loading nutrition data</p>
      </div>
    );
  }

  const { logs, summaries, goal } = data || { logs: [], summaries: [], goal: null };

  // Get today's summary
  const todaySummary = summaries[0];

  // Prepare calorie trend data
  const calorieTrendData = summaries
    .slice(0, 14)
    .reverse()
    .map((s) => ({
      date: format(new Date(s.date), "MMM d"),
      calories: s.totalCalories,
      target: s.targetCalories || goal?.target_calories || 0,
    }));

  // Prepare macro breakdown for pie chart
  const macroBreakdown = todaySummary
    ? [
        { name: "Protein", value: todaySummary.totalProtein * 4, grams: todaySummary.totalProtein },
        { name: "Carbs", value: todaySummary.totalCarbs * 4, grams: todaySummary.totalCarbs },
        { name: "Fat", value: todaySummary.totalFat * 9, grams: todaySummary.totalFat },
      ]
    : [];

  const summaryStats = weeklyData
    ? [
        {
          icon: Flame,
          label: "Avg Daily Calories",
          value: weeklyData.avgCalories.toLocaleString(),
          subValue: `${weeklyData.daysLogged} days logged this week`,
          color: "text-orange-500",
        },
        {
          icon: Beef,
          label: "Avg Protein",
          value: `${weeklyData.avgProtein}g`,
          subValue: goal
            ? `${Math.round((weeklyData.avgProtein / goal.target_protein) * 100)}% of target`
            : "No target set",
          color: "text-green-500",
        },
        {
          icon: Wheat,
          label: "Avg Carbs",
          value: `${weeklyData.avgCarbs}g`,
          subValue: goal
            ? `${Math.round((weeklyData.avgCarbs / goal.target_carbs) * 100)}% of target`
            : "No target set",
          color: "text-blue-500",
        },
        {
          icon: Droplet,
          label: "Avg Fat",
          value: `${weeklyData.avgFat}g`,
          subValue: goal
            ? `${Math.round((weeklyData.avgFat / goal.target_fat) * 100)}% of target`
            : "No target set",
          color: "text-yellow-500",
        },
      ]
    : [];

  if (summaries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-8 text-center">
          <Utensils className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Nutrition Data Yet</h3>
          <p className="text-muted-foreground mb-6">
            This client hasn't logged any meals yet. Set their nutrition goals to
            help them get started.
          </p>
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Target className="w-4 h-4 mr-2" />
                Set Nutrition Goals
              </Button>
            </DialogTrigger>
            <DialogContent>
              <GoalDialogContent
                newGoal={newGoal}
                setNewGoal={setNewGoal}
                onSave={handleSetGoal}
                isLoading={setGoalMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary Stats */}
      {!weeklyLoading && summaryStats.length > 0 && (
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
              <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Current Goals & Today's Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Progress */}
        {todaySummary && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Today's Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    {todaySummary.mealsCount} meals logged
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Calories */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Calories</span>
                  <span className="text-sm text-muted-foreground">
                    {todaySummary.totalCalories} / {todaySummary.targetCalories || "–"}
                  </span>
                </div>
                <Progress
                  value={Math.min(todaySummary.calorieProgress, 100)}
                  className="h-2"
                />
              </div>

              {/* Protein */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-green-500">Protein</span>
                  <span className="text-sm text-muted-foreground">
                    {todaySummary.totalProtein}g / {todaySummary.targetProtein || "–"}g
                  </span>
                </div>
                <Progress
                  value={Math.min(todaySummary.proteinProgress, 100)}
                  className="h-2 [&>div]:bg-green-500"
                />
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-500">Carbs</span>
                  <span className="text-sm text-muted-foreground">
                    {todaySummary.totalCarbs}g / {todaySummary.targetCarbs || "–"}g
                  </span>
                </div>
                <Progress
                  value={Math.min(todaySummary.carbsProgress, 100)}
                  className="h-2 [&>div]:bg-blue-500"
                />
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-500">Fat</span>
                  <span className="text-sm text-muted-foreground">
                    {todaySummary.totalFat}g / {todaySummary.targetFat || "–"}g
                  </span>
                </div>
                <Progress
                  value={Math.min(todaySummary.fatProgress, 100)}
                  className="h-2 [&>div]:bg-yellow-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Macro Breakdown Pie Chart */}
        {macroBreakdown.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Macro Distribution</h2>
                <p className="text-sm text-muted-foreground">Today's breakdown</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={macroBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill={MACRO_COLORS.protein} />
                    <Cell fill={MACRO_COLORS.carbs} />
                    <Cell fill={MACRO_COLORS.fat} />
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, entry: any) => [
                      `${entry.payload.grams}g (${Math.round(value)} kcal)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3 ml-4">
                {macroBreakdown.map((macro, i) => (
                  <div key={macro.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: Object.values(MACRO_COLORS)[i],
                      }}
                    />
                    <span className="text-sm">
                      {macro.name}: {macro.grams}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calorie Trend */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Calorie Trend</h2>
              <p className="text-sm text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {goal ? "Edit Goals" : "Set Goals"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <GoalDialogContent
                newGoal={newGoal}
                setNewGoal={setNewGoal}
                onSave={handleSetGoal}
                isLoading={setGoalMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {calorieTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={calorieTrendData}>
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
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
                name="Calories"
              />
              {goal && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Not enough data for trend chart
          </div>
        )}
      </div>

      {/* Current Goals Card */}
      {goal && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Nutrition Goals</h2>
              <Badge variant="outline" className="capitalize">
                {goal.goal_type}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-muted-foreground">Calories</p>
              <p className="text-2xl font-bold text-orange-500">
                {goal.target_calories}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-muted-foreground">Protein</p>
              <p className="text-2xl font-bold text-green-500">
                {goal.target_protein}g
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Carbs</p>
              <p className="text-2xl font-bold text-blue-500">
                {goal.target_carbs}g
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-muted-foreground">Fat</p>
              <p className="text-2xl font-bold text-yellow-500">
                {goal.target_fat}g
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Meal Logs */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recent Logs</h2>
            <p className="text-sm text-muted-foreground">
              Last {Math.min(logs.length, 7)} days
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {logs.slice(0, 7).map((log) => {
            const dayTotal = log.meals?.reduce((sum, meal) => {
              const mealCals =
                meal.meal_items?.reduce((s, i) => s + (i.calories || 0), 0) || 0;
              return sum + mealCals;
            }, 0) || 0;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50"
              >
                <div>
                  <h4 className="font-semibold">
                    {format(new Date(log.date), "EEEE, MMM d")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {log.meals?.length || 0} meals logged
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{dayTotal} kcal</p>
                  {log.target_calories && (
                    <Badge
                      variant="outline"
                      className={
                        dayTotal >= log.target_calories * 0.9 &&
                        dayTotal <= log.target_calories * 1.1
                          ? "bg-green-500/10 text-green-500 border-green-500/50"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                      }
                    >
                      {dayTotal >= log.target_calories * 0.9 &&
                      dayTotal <= log.target_calories * 1.1 ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : null}
                      {Math.round((dayTotal / log.target_calories) * 100)}% of
                      target
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Goal Dialog Content Component
interface GoalDialogContentProps {
  newGoal: {
    goalType: GoalType;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  };
  setNewGoal: (goal: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

const GoalDialogContent = ({
  newGoal,
  setNewGoal,
  onSave,
  isLoading,
}: GoalDialogContentProps) => (
  <>
    <DialogHeader>
      <DialogTitle>Set Nutrition Goals</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Goal Type</Label>
        <Select
          value={newGoal.goalType}
          onValueChange={(v) =>
            setNewGoal({ ...newGoal, goalType: v as GoalType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cutting">Cutting</SelectItem>
            <SelectItem value="bulking">Bulking</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Calories</Label>
        <Input
          type="number"
          value={newGoal.targetCalories}
          onChange={(e) =>
            setNewGoal({ ...newGoal, targetCalories: Number(e.target.value) })
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Protein (g)</Label>
          <Input
            type="number"
            value={newGoal.targetProtein}
            onChange={(e) =>
              setNewGoal({ ...newGoal, targetProtein: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Carbs (g)</Label>
          <Input
            type="number"
            value={newGoal.targetCarbs}
            onChange={(e) =>
              setNewGoal({ ...newGoal, targetCarbs: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Fat (g)</Label>
          <Input
            type="number"
            value={newGoal.targetFat}
            onChange={(e) =>
              setNewGoal({ ...newGoal, targetFat: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <Button onClick={onSave} className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Goals"}
      </Button>
    </div>
  </>
);