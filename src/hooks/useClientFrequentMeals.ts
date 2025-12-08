import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Frequent meal item stored in JSONB
 */
export interface FrequentMealItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Frequent meal data
 */
export interface FrequentMeal {
  id: string;
  user_id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake';
  items: FrequentMealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  usage_count: number;
  last_used_at: string;
  is_favorite: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Frequent add-on data
 */
export interface FrequentAddOn {
  id: string;
  user_id: string;
  base_meal_id: string | null;
  base_meal_name: string;
  addon_name: string;
  addon_quantity: number;
  addon_unit: string;
  addon_calories: number;
  addon_protein: number;
  addon_carbs: number;
  addon_fat: number;
  combination_count: number;
  last_combined_at: string;
  created_at: string;
}

/**
 * Summary of client's frequent meals patterns
 */
export interface FrequentMealsSummary {
  totalMeals: number;
  favoritesCount: number;
  mostUsedMeal: FrequentMeal | null;
  topMealTypes: { type: string; count: number }[];
  avgCaloriesPerMeal: number;
  avgProteinPerMeal: number;
}

/**
 * Fetch frequent meals for a client (read-only for coach)
 */
export const useClientFrequentMeals = (clientId: string, limit: number = 20) => {
  return useQuery({
    queryKey: ["client-frequent-meals", clientId, limit],
    queryFn: async () => {
      // Get frequent meals ordered by usage
      const { data: meals, error: mealsError } = await supabase
        .from("frequent_meals")
        .select("*")
        .eq("user_id", clientId)
        .order("is_favorite", { ascending: false })
        .order("usage_count", { ascending: false })
        .order("last_used_at", { ascending: false })
        .limit(limit);

      if (mealsError) throw mealsError;

      // Get frequent add-ons
      const { data: addOns, error: addOnsError } = await supabase
        .from("frequent_addons")
        .select("*")
        .eq("user_id", clientId)
        .order("combination_count", { ascending: false })
        .limit(50);

      if (addOnsError) throw addOnsError;

      // Parse JSONB items field
      const parsedMeals: FrequentMeal[] = (meals || []).map(meal => ({
        ...meal,
        items: typeof meal.items === 'string'
          ? JSON.parse(meal.items)
          : (meal.items || [])
      }));

      // Calculate summary
      const summary: FrequentMealsSummary = calculateSummary(parsedMeals);

      return {
        meals: parsedMeals,
        favorites: parsedMeals.filter(m => m.is_favorite),
        addOns: addOns as FrequentAddOn[],
        summary
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Calculate summary statistics from frequent meals
 */
function calculateSummary(meals: FrequentMeal[]): FrequentMealsSummary {
  if (meals.length === 0) {
    return {
      totalMeals: 0,
      favoritesCount: 0,
      mostUsedMeal: null,
      topMealTypes: [],
      avgCaloriesPerMeal: 0,
      avgProteinPerMeal: 0
    };
  }

  const favoritesCount = meals.filter(m => m.is_favorite).length;

  // Sort by usage to find most used
  const sortedByUsage = [...meals].sort((a, b) => b.usage_count - a.usage_count);
  const mostUsedMeal = sortedByUsage[0] || null;

  // Count meal types
  const typeCount: Record<string, number> = {};
  meals.forEach(meal => {
    typeCount[meal.meal_type] = (typeCount[meal.meal_type] || 0) + 1;
  });
  const topMealTypes = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate averages
  const totalCalories = meals.reduce((sum, m) => sum + m.total_calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.total_protein, 0);

  return {
    totalMeals: meals.length,
    favoritesCount,
    mostUsedMeal,
    topMealTypes,
    avgCaloriesPerMeal: Math.round(totalCalories / meals.length),
    avgProteinPerMeal: Math.round(totalProtein / meals.length)
  };
}

/**
 * Get add-ons for a specific meal
 */
export const useClientMealAddOns = (clientId: string, mealName: string) => {
  return useQuery({
    queryKey: ["client-meal-addons", clientId, mealName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frequent_addons")
        .select("*")
        .eq("user_id", clientId)
        .eq("base_meal_name", mealName)
        .order("combination_count", { ascending: false });

      if (error) throw error;
      return data as FrequentAddOn[];
    },
    enabled: !!clientId && !!mealName,
  });
};