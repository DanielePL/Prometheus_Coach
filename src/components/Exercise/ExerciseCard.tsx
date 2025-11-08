import { Heart } from "lucide-react";
import { Exercise } from "@/hooks/useExercises";
import { useNavigate } from "react-router-dom";

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
}

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onToggleFavorite,
}: ExerciseCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/exercise/${exercise.id}`);
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(exercise.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center transition-smooth hover:scale-110"
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
      <div className="p-4 px-5" onClick={handleCardClick}>
        <h3 className="font-bold text-lg">{exercise.title}</h3>
        {exercise.duration && (
          <p className="text-sm text-muted-foreground mt-1">
            {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
};
