import { Heart, Trash2 } from "lucide-react";
import { Exercise } from "@/hooks/useExercises";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteExercise } from "@/hooks/useDeleteExercise";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  showDelete?: boolean;
  onDeleteSuccess?: () => void;
}

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  showDelete = false,
  onDeleteSuccess,
}: ExerciseCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteExercise, isDeleting } = useDeleteExercise();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canDelete = showDelete && user && exercise.created_by === user.id;

  const handleCardClick = () => {
    navigate(`/exercise/${exercise.id}`);
  };

  const handleDelete = async () => {
    try {
      await deleteExercise({
        exerciseId: exercise.id,
        videoFilename: exercise.video_filename,
      });
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:bg-white/20 dark:hover:bg-black/30 p-0">
      <div className="relative h-48 overflow-hidden" onClick={handleCardClick}>
        <video
          src={exercise.cloudfront_url}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          muted
          playsInline
          preload="metadata"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            {exercise.category}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              disabled={isDeleting}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(exercise.id);
            }}
            className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite
                  ? "fill-primary text-primary"
                  : "text-foreground"
              }`}
            />
          </button>
        </div>
      </div>
      <div className="p-4 px-5" onClick={handleCardClick}>
        <h3 className="font-bold text-lg">{exercise.title}</h3>
        {exercise.duration && (
          <p className="text-sm text-muted-foreground mt-1">
            {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exercise and its video.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
