import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import bannerImg from "@/assets/gym-banner.jpg";
import { useExercises, ExerciseCategory } from "@/hooks/useExercises";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
import { ExerciseCard } from "@/components/Exercise/ExerciseCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const categories = ["all", "bodybuilding", "crossfit", "powerlifting", "weightlifting", "functional", "plyometrics"] as const;

const Explore = () => {
  const { theme, setTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: exercises = [], isLoading } = useExercises({
    category: selectedCategory === "all" ? undefined : (selectedCategory as ExerciseCategory),
    searchQuery: searchQuery || undefined,
  });

  // Filter to show only public exercises
  const publicExercises = exercises.filter((ex) => ex.visibility === "public");

  const { isFavorite, toggleFavorite } = useFavoriteExercises();

  return (
    <div 
      className="min-h-screen flex w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      
      <main className="flex-1 lg:ml-20 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-7xl">
          {/* Banner Section with Theme Toggle */}
          <div className="relative w-full h-48 lg:h-56 rounded-3xl overflow-hidden mb-8">
            <img 
              src={bannerImg}
              alt="Explore exercises"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${theme === "dark" ? "bg-black/50" : "bg-gradient-to-r from-primary/80 to-orange-500/60"}`} />
            
            {/* Theme Toggle - Overlapping Image */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="absolute top-4 right-4 glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground z-10"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>

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

            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
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
          </div>

          {/* Exercise Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading exercises...</p>
            </div>
          ) : publicExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No exercises found. Try a different search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-8">
              {publicExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isFavorite={isFavorite(exercise.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
