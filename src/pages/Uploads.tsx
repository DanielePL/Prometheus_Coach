import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises } from "@/hooks/useExercises";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { ExerciseCard } from "@/components/Exercise/ExerciseCard";
import { UploadExerciseModal } from "@/components/Exercise/UploadExerciseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Moon, Sun } from "lucide-react";
import { ExerciseCategory } from "@/hooks/useExercises";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import bannerImg from "@/assets/gym-banner.jpg";

const categories: ExerciseCategory[] = [
  "bodybuilding",
  "crossfit",
  "powerlifting",
  "weightlifting",
  "functional",
  "plyometrics",
];

const Uploads = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: exercises = [], isLoading, refetch } = useExercises({
    category: selectedCategory,
    searchQuery,
  });

  // Filter to show only current user's uploads
  const myExercises = exercises.filter((ex) => ex.created_by === user?.id);

  const { isFavorite, toggleFavorite } = useFavoriteExercises();

  const handleUploadSuccess = () => {
    refetch();
    setIsUploadModalOpen(false);
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
          {/* Banner Section with Theme Toggle and Upload Button */}
          <div className="relative w-full h-48 lg:h-56 rounded-3xl overflow-hidden mb-8">
            <img 
              src={bannerImg}
              alt="My uploads"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${theme === "dark" ? "bg-black/50" : "bg-gradient-to-r from-primary/80 to-orange-500/60"}`} />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-8">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  My Uploads
                </h1>
                <p className="text-white/90 text-base lg:text-lg">
                  Manage your exercise library
                </p>
              </div>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload New Video
              </Button>
            </div>

            {/* Theme Toggle */}
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

          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search your exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`
                  capitalize px-4 py-2 rounded-full text-sm font-semibold
                  transition-smooth
                  ${selectedCategory === undefined
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]' 
                    : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                  }
                `}
              >
                All
              </button>
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

            {/* Exercise Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading exercises...</p>
              </div>
            ) : myExercises.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl p-8">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No videos uploaded yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Upload New Video" to add your first exercise
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Video
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-8">
                {myExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={isFavorite(exercise.id)}
                    onToggleFavorite={toggleFavorite}
                    showDelete={true}
                    showEdit={true}
                    onDeleteSuccess={refetch}
                    onEditSuccess={refetch}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      <UploadExerciseModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Uploads;
