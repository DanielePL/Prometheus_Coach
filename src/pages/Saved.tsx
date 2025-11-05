import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
import { ExerciseCard } from "@/components/Exercise/ExerciseCard";
import { ExerciseDetailModal } from "@/components/Exercise/ExerciseDetailModal";
import { useState } from "react";
import { Exercise } from "@/hooks/useExercises";

const Saved = () => {
  const { theme, setTheme } = useTheme();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { favorites, isLoading, toggleFavorite, isFavorite } = useFavoriteExercises();

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

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
          {/* Header with Title and Theme Toggle */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">Saved Exercises</h1>
            
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Exercise Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading saved exercises...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No saved exercises yet. Browse the library to save your favorites!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {favorites.map((favorite) => (
                <ExerciseCard
                  key={favorite.id}
                  exercise={favorite.exercises as Exercise}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => handleExerciseClick(favorite.exercises as Exercise)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isFavorite={selectedExercise ? isFavorite(selectedExercise.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default Saved;
