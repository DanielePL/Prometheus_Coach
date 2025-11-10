import { Heart, Trash2, Edit } from "lucide-react";
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
import { EditExerciseModal } from "./EditExerciseModal";

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  onDeleteSuccess?: () => void;
  onEditSuccess?: () => void;
}

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  showDelete = false,
  showEdit = false,
  onDeleteSuccess,
  onEditSuccess,
}: ExerciseCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteExercise, isDeleting } = useDeleteExercise();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const canDelete = showDelete && user && exercise.created_by === user.id;
  const canEdit = showEdit && user && exercise.created_by === user.id;

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

  // Log thumbnail info for debugging
  console.log(`[ExerciseCard] ${exercise.title}:`, {
    hasThumbnail: !!exercise.thumbnail_url,
    thumbnailUrl: exercise.thumbnail_url,
    videoUrl: exercise.cloudfront_url
  })

  return (
    <div className="glass rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:bg-white/20 dark:hover:bg-black/30 p-0">
      <div className="relative h-48 overflow-hidden" onClick={handleCardClick}>
        {exercise.thumbnail_url && !exercise.thumbnail_url.startsWith('data:') ? (
          // Use thumbnail image if available and not a data URL
          <img
            src={exercise.thumbnail_url}
            alt={exercise.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            onError={(e) => {
              console.error(`[ExerciseCard] Thumbnail failed to load for ${exercise.title}:`, exercise.thumbnail_url)
              // Fallback to video if thumbnail fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const video = document.createElement('video')
              video.src = exercise.cloudfront_url
              video.className = 'w-full h-full object-cover transition-all duration-500 group-hover:scale-110'
              video.muted = true
              video.playsInline = true
              video.preload = 'metadata'
              target.parentElement?.appendChild(video)
            }}
          />
        ) : (
          // Fallback to video with poster
          <video
            src={exercise.cloudfront_url}
            poster={exercise.thumbnail_url?.startsWith('data:') ? exercise.thumbnail_url : undefined}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            muted
            playsInline
            preload="metadata"
            onError={() => {
              console.error(`[ExerciseCard] Video failed to load for ${exercise.title}:`, exercise.cloudfront_url)
            }}
          />
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            {exercise.category}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
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

      <EditExerciseModal
        exercise={exercise}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={onEditSuccess}
      />

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
