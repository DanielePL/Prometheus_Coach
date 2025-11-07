import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises } from "@/hooks/useExercises";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { ExerciseCard } from "@/components/Exercise/ExerciseCard";
import { ExerciseDetailModal } from "@/components/Exercise/ExerciseDetailModal";
import { UploadExerciseModal } from "@/components/Exercise/UploadExerciseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search } from "lucide-react";
import { Exercise, ExerciseCategory } from "@/hooks/useExercises";

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
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: exercises = [], isLoading, refetch } = useExercises({
    category: selectedCategory,
    searchQuery,
  });

  // Filter to show only current user's uploads
  const myExercises = exercises.filter((ex) => ex.created_by === user?.id);

  const { isFavorite, toggleFavorite } = useFavoriteExercises();

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDetailModalOpen(true);
  };

  const handleUploadSuccess = () => {
    refetch();
    setIsUploadModalOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-8">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/src/assets/gym-banner.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative h-full flex items-center justify-between px-6 lg:px-12">
            <div>
              <h1 className="text-4xl lg:text-5xl font-heading text-white mb-2">
                My Uploads
              </h1>
              <p className="text-white/90 text-lg">
                Manage your exercise library
              </p>
            </div>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload New Video
            </Button>
          </div>
        </div>

        <div className="px-6 lg:px-12 py-8 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search your exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 glass"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === undefined ? "default" : "outline"}
              onClick={() => setSelectedCategory(undefined)}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Exercise Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : myExercises.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isFavorite={isFavorite(exercise.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => handleExerciseClick(exercise)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        isFavorite={selectedExercise ? isFavorite(selectedExercise.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      <UploadExerciseModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Uploads;
