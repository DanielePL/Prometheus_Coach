import { useState } from "react";
import {
  Zap,
  Star,
  Clock,
  Beef,
  Wheat,
  Droplet,
  Flame,
  ChevronDown,
  ChevronUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useClientFrequentMeals,
  FrequentMeal,
  FrequentAddOn,
} from "@/hooks/useClientFrequentMeals";
import { formatDistanceToNow } from "date-fns";

interface ClientFrequentMealsProps {
  clientId: string;
}

const mealTypeIcons: Record<string, any> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Cookie,
  shake: Coffee,
};

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  lunch: "bg-green-500/10 text-green-500 border-green-500/20",
  dinner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  snack: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  shake: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export const ClientFrequentMeals = ({ clientId }: ClientFrequentMealsProps) => {
  const { data, isLoading, error } = useClientFrequentMeals(clientId, 15);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-red-500">Error loading frequent meals</p>
      </div>
    );
  }

  const { meals, favorites, addOns, summary } = data || {
    meals: [],
    favorites: [],
    addOns: [],
    summary: null,
  };

  if (meals.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Quick Add Patterns</h2>
            <p className="text-sm text-muted-foreground">
              Learned eating habits
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Patterns Yet</h3>
          <p className="text-muted-foreground text-sm">
            Once your client starts logging meals regularly, their most common
            meals will appear here for quick tracking.
          </p>
        </div>
      </div>
    );
  }

  const displayedMeals = showAll ? meals : meals.slice(0, 5);

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Quick Add Patterns</h2>
            <p className="text-sm text-muted-foreground">
              {summary?.totalMeals} learned meals
              {summary?.favoritesCount ? ` | ${summary.favoritesCount} favorites` : ""}
            </p>
          </div>
        </div>
        {favorites.length > 0 && (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            {favorites.length} Favorites
          </Badge>
        )}
      </div>

      {/* Summary Stats */}
      {summary && summary.mostUsedMeal && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Most Used</p>
            <p className="font-semibold text-sm truncate">
              {summary.mostUsedMeal.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.mostUsedMeal.usage_count}x used
            </p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Top Type</p>
            <p className="font-semibold text-sm capitalize">
              {summary.topMealTypes[0]?.type || "–"}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.topMealTypes[0]?.count || 0} meals
            </p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Avg Calories</p>
            <p className="font-semibold text-sm">
              {summary.avgCaloriesPerMeal} kcal
            </p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
            <p className="font-semibold text-sm">{summary.avgProteinPerMeal}g</p>
          </div>
        </div>
      )}

      {/* Frequent Meals List */}
      <div className="space-y-2">
        {displayedMeals.map((meal) => (
          <FrequentMealCard
            key={meal.id}
            meal={meal}
            addOns={addOns.filter(
              (a) => a.base_meal_id === meal.id || a.base_meal_name === meal.name
            )}
            isExpanded={expandedMeal === meal.id}
            onToggle={() =>
              setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
            }
          />
        ))}
      </div>

      {/* Show More Button */}
      {meals.length > 5 && (
        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All ({meals.length - 5} more)
            </>
          )}
        </Button>
      )}
    </div>
  );
};

interface FrequentMealCardProps {
  meal: FrequentMeal;
  addOns: FrequentAddOn[];
  isExpanded: boolean;
  onToggle: () => void;
}

const FrequentMealCard = ({
  meal,
  addOns,
  isExpanded,
  onToggle,
}: FrequentMealCardProps) => {
  const MealIcon = mealTypeIcons[meal.meal_type] || Utensils;
  const colorClass = mealTypeColors[meal.meal_type] || mealTypeColors.lunch;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="rounded-xl bg-background/50 border border-border/50 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}
              >
                <MealIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{meal.name}</h4>
                  {meal.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs capitalize">
                    {meal.meal_type}
                  </Badge>
                  <span>{meal.usage_count}x used</span>
                  <span>
                    {formatDistanceToNow(new Date(meal.last_used_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-primary">
                  {Math.round(meal.total_calories)} kcal
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-green-500">
                    P: {Math.round(meal.total_protein)}g
                  </span>
                  <span className="text-blue-500">
                    C: {Math.round(meal.total_carbs)}g
                  </span>
                  <span className="text-yellow-500">
                    F: {Math.round(meal.total_fat)}g
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border/50">
            {/* Meal Items */}
            {meal.items && meal.items.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Items</h5>
                <div className="space-y-1">
                  {meal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm py-1 px-2 rounded bg-background/50"
                    >
                      <span>
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(item.calories)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Add-Ons */}
            {addOns.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">
                  Common Add-Ons ({addOns.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {addOns.slice(0, 5).map((addOn) => (
                    <Badge
                      key={addOn.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      + {addOn.addon_name}
                      <span className="ml-1 text-muted-foreground">
                        ({addOn.combination_count}x)
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Breakdown Bar */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <h5 className="text-sm font-medium mb-2">Macro Breakdown</h5>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-background">
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${
                      ((meal.total_protein * 4) / meal.total_calories) * 100
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-500 transition-all"
                  style={{
                    width: `${
                      ((meal.total_carbs * 4) / meal.total_calories) * 100
                    }%`,
                  }}
                />
                <div
                  className="bg-yellow-500 transition-all"
                  style={{
                    width: `${
                      ((meal.total_fat * 9) / meal.total_calories) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>
                  Protein:{" "}
                  {Math.round(
                    ((meal.total_protein * 4) / meal.total_calories) * 100
                  )}
                  %
                </span>
                <span>
                  Carbs:{" "}
                  {Math.round(
                    ((meal.total_carbs * 4) / meal.total_calories) * 100
                  )}
                  %
                </span>
                <span>
                  Fat:{" "}
                  {Math.round(
                    ((meal.total_fat * 9) / meal.total_calories) * 100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};