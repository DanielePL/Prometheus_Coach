import { Heart } from "lucide-react";
import { Exercise } from "@/hooks/useExercises";
import { useState } from "react";

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onClick: () => void;
}

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  onClick,
}: ExerciseCardProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:bg-white/20 dark:hover:bg-black/30 p-0">
      <div className="relative h-48 overflow-hidden" onClick={onClick}>
        {imageError ? (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-lg font-bold">{exercise.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{exercise.category}</p>
            </div>
          </div>
        ) : (
          <img
            src={exercise.cloudfront_url}
            alt={exercise.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            loading="lazy"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        )}
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
      <div className="p-4 px-5" onClick={onClick}>
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
