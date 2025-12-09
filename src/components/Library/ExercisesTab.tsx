import { useState } from "react";
import { Search, Dumbbell } from "lucide-react";
import { useExerciseLibrary, useExerciseCategories, MappedExercise } from "@/hooks/useExerciseLibrary";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
import { ExerciseCard } from "@/components/Exercise/ExerciseCard";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";

// Sports filter options
const sportFilters = ["all", "Weightlifting", "Powerlifting", "General Strength", "CrossFit", "Hyrox"] as const;

export const ExercisesTab = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isCoach } = useUserRole();

  // Fetch from the main Prometheus exercise library (810+ exercises)
  const { data: exercises = [], isLoading } = useExerciseLibrary({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    searchQuery: searchQuery || undefined,
    sport: selectedSport === "all" ? undefined : selectedSport,
  });

  // Get unique categories from library
  const { data: categories = [] } = useExerciseCategories();

  // All library exercises are visible (no visibility filter needed)
  const filteredExercises = exercises;

  const { isFavorite, toggleFavorite } = useFavoriteExercises();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass"
          />
        </div>

        {/* Sport Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground font-medium mr-2">Sport:</span>
          {sportFilters.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold
                transition-smooth
                ${selectedSport === sport
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                  : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                }
              `}
            >
              {sport === "all" ? "All Sports" : sport}
            </button>
          ))}
        </div>

        {/* Category Filters - Dynamic from library */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-muted-foreground font-medium mr-2">Muscle:</span>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold
                transition-smooth
                ${selectedCategory === "all"
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                  : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                }
              `}
            >
              All
            </button>
            {categories.slice(0, 10).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  capitalize px-4 py-2 rounded-full text-sm font-semibold
                  transition-smooth
                  ${selectedCategory === category
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                    : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          <Dumbbell className="inline-block w-4 h-4 mr-1" />
          {filteredExercises.length} exercises found
        </div>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No exercises found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise as any}
              isFavorite={isFavorite(exercise.id)}
              onToggleFavorite={toggleFavorite}
              showShare={isCoach}
            />
          ))}
        </div>
      )}
    </div>
  );
};
