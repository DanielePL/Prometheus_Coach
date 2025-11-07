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
          {/* Video Player - Optimized for vertical format */}
          <div className="flex justify-center px-6">
            <div className="relative rounded-xl overflow-hidden bg-black w-full max-w-[400px] max-h-[700px] lg:max-w-[400px]">
              <video
                controls
                className="w-full h-auto"
                src={exercise.cloudfront_url}
                playsInline
                style={{ maxHeight: '700px' }}
              >
                Your browser doesn't support video playback.
              </video>
            </div>
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

          {/* Equipment & Muscles */}
          <div className="flex flex-wrap gap-2">
            {exercise.equipment && (
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
                Equipment: {exercise.equipment}
              </span>
            )}
            {exercise.primary_muscles && (
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
                Muscles: {exercise.primary_muscles}
              </span>
            )}
          </div>

          {/* Description */}
          {exercise.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Suggested Program */}
          {(exercise.suggested_sets || exercise.suggested_reps || exercise.suggested_weight) && (
            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">Suggested Program</h3>
              <div className="grid grid-cols-3 gap-4">
                {exercise.suggested_sets && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{exercise.suggested_sets}</p>
                    <p className="text-sm text-muted-foreground">Sets</p>
                  </div>
                )}
                {exercise.suggested_reps && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{exercise.suggested_reps}</p>
                    <p className="text-sm text-muted-foreground">Reps</p>
                  </div>
                )}
                {exercise.suggested_weight && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{exercise.suggested_weight}</p>
                    <p className="text-sm text-muted-foreground">Weight</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Aspects */}
          {exercise.key_aspects && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Key Aspects</h3>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {exercise.key_aspects}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Common Mistakes</h3>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {exercise.common_mistakes}
              </div>
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
