import { Heart, Trash2, Edit, Share2 } from "lucide-react";
import { Exercise } from "@/hooks/useExercises";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteExercise } from "@/hooks/useDeleteExercise";
import { useAssignExercise } from "@/hooks/useAssignExercise";
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
import { AssignExerciseModal } from "./AssignExerciseModal";

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  showShare?: boolean;
  isUploadsPage?: boolean;
  onDeleteSuccess?: () => void;
  onEditSuccess?: () => void;
  onAssignSuccess?: () => void;
}

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  showDelete = false,
  showEdit = false,
  showShare = false,
  isUploadsPage = false,
  onDeleteSuccess,
  onEditSuccess,
  onAssignSuccess,
}: ExerciseCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteExercise, isDeleting } = useDeleteExercise();
  const { assignExercise } = useAssignExercise();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

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

  const handleAssign = async (clientIds: string[]) => {
    if (!user) return;
    
    await assignExercise({
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      clientIds,
      coachId: user.id,
    });
    
    onAssignSuccess?.();
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
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:grayscale"
            onError={(e) => {
              console.error(`[ExerciseCard] Thumbnail failed to load for ${exercise.title}:`, exercise.thumbnail_url)
              // Fallback to video if thumbnail fails - add #t=0.1 for Safari
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const video = document.createElement('video')
              video.src = `${exercise.cloudfront_url}#t=0.1`
              video.className = 'w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:grayscale'
              video.muted = true
              video.playsInline = true
              video.preload = 'metadata'
              video.setAttribute('webkit-playsinline', 'true')
              target.parentElement?.appendChild(video)
            }}
          />
        ) : (
          // Fallback to video - add #t=0.1 for Safari to show first frame
          <video
            src={`${exercise.cloudfront_url}#t=0.1`}
            poster={exercise.thumbnail_url?.startsWith('data:') ? exercise.thumbnail_url : undefined}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:grayscale"
            muted
            playsInline
            preload="metadata"
            webkit-playsinline="true"
            onError={() => {
              console.error(`[ExerciseCard] Video failed to load for ${exercise.title}:`, exercise.cloudfront_url)
            }}
          />
        )}
        
        {/* Icon overlays - conditional based on page */}
        {isUploadsPage ? (
          // Uploads page: Show Edit + Delete (top left) and Share + Heart (top right)
          <>
            <div className="absolute top-3 left-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-primary hover:text-primary-foreground"
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
                  className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {showShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAssignModal(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                >
                  <Share2 className="w-4 h-4" />
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
          </>
        ) : (
          // Other pages: Show only Share + Heart (top right)
          <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {showShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignModal(true);
                }}
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Share2 className="w-4 h-4" />
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
        )}
      </div>
      <div className="p-4 px-5" onClick={handleCardClick}>
        <h3 className="font-bold text-lg mb-2">{exercise.title}</h3>
        <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {exercise.category}
        </span>
      </div>

      <EditExerciseModal
        exercise={exercise}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={onEditSuccess}
      />

      <AssignExerciseModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        onAssign={handleAssign}
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
