import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exerciseLibraryClient } from "@/integrations/supabase/exerciseLibraryClient";

/**
 * Meal types
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake';

/**
 * Nutrition goal types
 */
export type GoalType = 'cutting' | 'bulking' | 'maintenance' | 'performance';

/**
 * Meal item with full nutrient data
 */
export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string | null;
  item_name: string;
  quantity: number;
  quantity_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturated_fat?: number;
  sodium?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  created_at: string;
}

/**
 * Meal with items
 */
export interface Meal {
  id: string;
  nutrition_log_id: string;
  meal_type: MealType;
  meal_name: string | null;
  time: string;
  photo_url: string | null;
  ai_analysis_id: string | null;
  ai_confidence: number | null;
  notes: string | null;
  created_at: string;
  meal_items?: MealItem[];
}

/**
 * Daily nutrition log
 */
export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  notes: string | null;
  created_at: string;
  meals?: Meal[];
}

/**
 * Nutrition goals
 */
export interface NutritionGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meals_per_day: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Daily summary
 */
export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  mealsCount: number;
  calorieProgress: number; // percentage
  proteinProgress: number;
  carbsProgress: number;
  fatProgress: number;
}

/**
 * Fetch nutrition logs for a client (last 30 days)
 */
export const useClientNutrition = (clientId: string, days: number = 30) => {
  return useQuery({
    queryKey: ["client-nutrition", clientId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get nutrition logs
      const { data: logs, error: logsError } = await exerciseLibraryClient
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", clientId)
        .gte("date", startDate.toISOString().split('T')[0])
        .order("date", { ascending: false });

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return { logs: [], summaries: [], goal: null };

      // Get meals for these logs
      const logIds = logs.map(l => l.id);
      const { data: meals, error: mealsError } = await exerciseLibraryClient
        .from("meals")
        .select("*")
        .in("nutrition_log_id", logIds)
        .order("time", { ascending: true });

      if (mealsError) throw mealsError;

      // Get meal items
      const mealIds = (meals || []).map(m => m.id);
      const { data: items, error: itemsError } = await exerciseLibraryClient
        .from("meal_items")
        .select("*")
        .in("meal_id", mealIds);

      if (itemsError) throw itemsError;

      // Get active nutrition goal
      const { data: goals } = await exerciseLibraryClient
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", clientId)
        .eq("is_active", true)
        .limit(1);

      const goal = goals?.[0] || null;

      // Attach items to meals
      const mealsWithItems = (meals || []).map(meal => ({
        ...meal,
        meal_items: (items || []).filter(i => i.meal_id === meal.id)
      }));

      // Attach meals to logs
      const logsWithMeals = logs.map(log => ({
        ...log,
        meals: mealsWithItems.filter(m => m.nutrition_log_id === log.id)
      }));

      // Calculate daily summaries
      const summaries: DailyNutritionSummary[] = logsWithMeals.map(log => {
        const allItems = log.meals?.flatMap(m => m.meal_items || []) || [];
        const totalCalories = allItems.reduce((sum, i) => sum + (i.calories || 0), 0);
        const totalProtein = allItems.reduce((sum, i) => sum + (i.protein || 0), 0);
        const totalCarbs = allItems.reduce((sum, i) => sum + (i.carbs || 0), 0);
        const totalFat = allItems.reduce((sum, i) => sum + (i.fat || 0), 0);

        const targetCalories = log.target_calories || goal?.target_calories || null;
        const targetProtein = log.target_protein || goal?.target_protein || null;
        const targetCarbs = log.target_carbs || goal?.target_carbs || null;
        const targetFat = log.target_fat || goal?.target_fat || null;

        return {
          date: log.date,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFat,
          mealsCount: log.meals?.length || 0,
          calorieProgress: targetCalories ? (totalCalories / targetCalories) * 100 : 0,
          proteinProgress: targetProtein ? (totalProtein / targetProtein) * 100 : 0,
          carbsProgress: targetCarbs ? (totalCarbs / targetCarbs) * 100 : 0,
          fatProgress: targetFat ? (totalFat / targetFat) * 100 : 0
        };
      });

      return {
        logs: logsWithMeals as NutritionLog[],
        summaries,
        goal: goal as NutritionGoal | null
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Get weekly nutrition averages
 */
export const useClientNutritionWeekly = (clientId: string) => {
  return useQuery({
    queryKey: ["client-nutrition-weekly", clientId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: logs } = await exerciseLibraryClient
        .from("nutrition_logs")
        .select(`
          id,
          date,
          meals (
            id,
            meal_items (
              calories,
              protein,
              carbs,
              fat
            )
          )
        `)
        .eq("user_id", clientId)
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0]);

      if (!logs || logs.length === 0) {
        return {
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          daysLogged: 0
        };
      }

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      logs.forEach(log => {
        const items = (log.meals as any[])?.flatMap((m: any) => m.meal_items || []) || [];
        totalCalories += items.reduce((sum: number, i: any) => sum + (i.calories || 0), 0);
        totalProtein += items.reduce((sum: number, i: any) => sum + (i.protein || 0), 0);
        totalCarbs += items.reduce((sum: number, i: any) => sum + (i.carbs || 0), 0);
        totalFat += items.reduce((sum: number, i: any) => sum + (i.fat || 0), 0);
      });

      const daysLogged = logs.length;

      return {
        avgCalories: Math.round(totalCalories / daysLogged),
        avgProtein: Math.round(totalProtein / daysLogged),
        avgCarbs: Math.round(totalCarbs / daysLogged),
        avgFat: Math.round(totalFat / daysLogged),
        daysLogged
      };
    },
    enabled: !!clientId,
  });
};

/**
 * Set nutrition goals for a client (coach action)
 */
export const useSetClientNutritionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      goalType,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat
    }: {
      clientId: string;
      goalType: GoalType;
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
    }) => {
      // Deactivate existing goals
      await exerciseLibraryClient
        .from("nutrition_goals")
        .update({ is_active: false })
        .eq("user_id", clientId)
        .eq("is_active", true);

      // Create new goal
      const { data, error } = await exerciseLibraryClient
        .from("nutrition_goals")
        .insert({
          user_id: clientId,
          goal_type: goalType,
          target_calories: targetCalories,
          target_protein: targetProtein,
          target_carbs: targetCarbs,
          target_fat: targetFat,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-nutrition", variables.clientId] });
    }
  });
};