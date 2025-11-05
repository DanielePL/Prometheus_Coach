import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Exercise } from "@/hooks/useExercises";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
}

export const ExerciseDetailModal = ({
  exercise,
  open,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: ExerciseDetailModalProps) => {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{exercise.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              controls
              className="w-full"
              src={exercise.cloudfront_url}
              playsInline
            >
              Your browser doesn't support video playback.
            </video>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
              {exercise.category}
            </span>
            {exercise.duration && (
              <span className="text-muted-foreground">
                {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Description */}
          {exercise.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Favorite Button */}
          <Button
            onClick={() => onToggleFavorite(exercise.id)}
            variant={isFavorite ? "default" : "outline"}
            className="w-full"
          >
            <Heart
              className={`w-4 h-4 mr-2 ${
                isFavorite ? "fill-current" : ""
              }`}
            />
            {isFavorite ? "Remove from Favorites" : "Save to Favorites"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
