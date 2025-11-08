import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { ExerciseHeader } from "@/components/Exercise/ExerciseHeader";
import { ExerciseHero } from "@/components/Exercise/ExerciseHero";
import { InfoCard } from "@/components/Exercise/InfoCard";
import { ProgramTile } from "@/components/Exercise/ProgramTile";
import { RelatedWorkouts } from "@/components/Exercise/RelatedWorkouts";
import { Bookmark, Share2, Moon, Sun, Flame, Weight, Clock, Heart, Activity, TrendingUp, AlertTriangle, Target, Zap, Trash2, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavoriteExercises } from "@/hooks/useFavoriteExercises";
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
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import frontSquatImg from "@/assets/front.jpg";
import andersonSquatImg from "@/assets/anderson.jpg";

const ExerciseDetail = () => {
  const { theme, setTheme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavoriteExercises();
  const { user } = useAuth();
  const { deleteExercise, isDeleting } = useDeleteExercise();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const relatedWorkouts = [
    { name: "Front Squat", image: frontSquatImg },
    { name: "Anderson Squat", image: andersonSquatImg }
  ];

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})` }}
      >
        <p className="text-muted-foreground">Loading exercise...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})` }}
      >
        <p className="text-muted-foreground">Exercise not found</p>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (exercise) {
      toggleFavorite(exercise.id);
    }
  };

  const canDelete = user && exercise && (exercise.created_by === user.id);

  const handleDelete = async () => {
    if (!exercise) return;
    
    try {
      await deleteExercise({
        exerciseId: exercise.id,
        videoFilename: exercise.video_filename,
      });
      navigate("/uploads");
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div 
      className="min-h-screen flex bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})` }}
    >
      <Sidebar />
      
      <main className="flex-1 lg:ml-20 pb-20 lg:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="glass rounded-xl p-2 mb-4 flex items-center gap-2 hover:bg-background/60 transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <ExerciseHeader title={exercise.title} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Exercise Video */}
            <div className="lg:col-span-7 space-y-6">
              <div className="lg:mt-[10px]">
                <ExerciseHero 
                  image={exercise.thumbnail_url || exercise.cloudfront_url}
                  alt={exercise.title}
                  title={exercise.title}
                />
              </div>
              
              {/* Desktop Related Workouts */}
              <div className="hidden lg:block lg:mt-6">
                <RelatedWorkouts workouts={relatedWorkouts} />
              </div>
              
              {/* Mobile Info Cards */}
              <div className="lg:hidden lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {exercise.equipment && (
                    <div className="bg-primary rounded-2xl px-4 py-2">
                      <span className="text-white font-normal">Equipment: {exercise.equipment}</span>
                    </div>
                  )}
                  <button 
                    onClick={handleToggleFavorite}
                    className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth"
                  >
                    <Bookmark 
                      size={18} 
                      className={isFavorite(exercise.id) ? "fill-primary text-primary" : "text-foreground"} 
                    />
                  </button>
                  <button className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth">
                    <Share2 size={18} className="text-foreground" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun size={18} className="text-foreground" /> : <Moon size={18} className="text-foreground" />}
                  </button>
                </div>
                
                {exercise.primary_muscles && (
                  <InfoCard
                    icon={Target}
                    label="Primary Muscle Groups"
                    value={<div className="text-base font-normal">{exercise.primary_muscles}</div>}
                    variant="accent"
                  />
                )}
                
                {exercise.key_aspects && (
                  <InfoCard
                    icon={Zap}
                    label="Key Aspects"
                    value={
                      <ul className="space-y-1 text-sm">
                        {exercise.key_aspects.split('\n').map((aspect, idx) => (
                          <li key={idx}>• {aspect}</li>
                        ))}
                      </ul>
                    }
                    variant="accent"
                  />
                )}
                
                {(exercise.suggested_sets || exercise.suggested_reps || exercise.suggested_weight) && (
                  <div>
                    <p className="text-base font-medium text-foreground mb-3">Suggested Program</p>
                    <div className="grid grid-cols-3 gap-3">
                      {exercise.suggested_sets && <ProgramTile label="Sets" value={exercise.suggested_sets.toString()} />}
                      {exercise.suggested_reps && <ProgramTile label="Reps" value={exercise.suggested_reps} />}
                      {exercise.suggested_weight && <ProgramTile label="Weight" value={exercise.suggested_weight} />}
                    </div>
                  </div>
                )}

                {exercise.common_mistakes && (
                  <InfoCard
                    icon={AlertTriangle}
                    label="Common Mistakes"
                    value={<div className="text-sm font-normal">{exercise.common_mistakes}</div>}
                    variant="accent"
                  />
                )}

                {/* Workout Metrics */}
                <div>
                  <p className="text-base font-medium text-foreground mb-3">Workout Metrics Based on Suggested Program</p>
                  <div className="grid grid-cols-1 gap-3">
                    <InfoCard
                      icon={Flame}
                      label="Calories Burned"
                      value={
                        <div className="text-sm font-normal space-y-1">
                          <div>Per set: ~6–8 calories</div>
                          <div>Total (4 sets): ~25–35 calories</div>
                          <div>With rest: ~40–60 calories total</div>
                        </div>
                      }
                      variant="accent"
                    />
                    <InfoCard
                      icon={Weight}
                      label="Total Volume"
                      value={<div className="text-sm font-normal">Calculated based on your program</div>}
                      variant="accent"
                    />
                    <InfoCard
                      icon={Clock}
                      label="Time Under Tension"
                      value={<div className="text-sm font-normal">~1 min total (3 s eccentric + 1 s concentric per rep)</div>}
                      variant="accent"
                    />
                    <InfoCard
                      icon={Heart}
                      label="Heart Rate Range"
                      value={<div className="text-sm font-normal">~120–150 bpm (moderate intensity)</div>}
                      variant="accent"
                    />
                    <InfoCard
                      icon={Activity}
                      label="Metabolic Equivalent (MET)"
                      value={<div className="text-sm font-normal">~6 METs (strength training, moderate–vigorous)</div>}
                      variant="accent"
                    />
                    <InfoCard
                      icon={TrendingUp}
                      label="Calories/minute"
                      value={<div className="text-sm font-normal">~5–8 cal/min (based on bodyweight)</div>}
                      variant="accent"
                    />
                  </div>
                </div>
                
                {/* Mobile Related Workouts */}
                <div className="lg:hidden">
                  <RelatedWorkouts workouts={relatedWorkouts} />
                </div>
              </div>
            </div>
            
            {/* Right Column - Exercise Details (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-5 space-y-6">
              <ExerciseHeader title={exercise.title} />
              
              <div className="flex items-center gap-3 flex-wrap">
                {exercise.equipment && (
                  <div className="bg-primary rounded-2xl px-5 py-3">
                    <span className="text-white font-normal">Equipment: {exercise.equipment}</span>
                  </div>
                )}
                <button 
                  onClick={handleToggleFavorite}
                  className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth"
                >
                  <Bookmark 
                    size={18} 
                    className={isFavorite(exercise.id) ? "fill-primary text-primary" : "text-foreground"} 
                  />
                </button>
                <button className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth">
                  <Share2 size={18} className="text-foreground" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button 
                  className="glass rounded-2xl p-2 flex items-center justify-center hover:bg-background/60 transition-smooth"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun size={18} className="text-foreground" /> : <Moon size={18} className="text-foreground" />}
                </button>
              </div>
              
              {exercise.primary_muscles && (
                <InfoCard
                  icon={Target}
                  label="Primary Muscle Groups"
                  value={<div className="text-base font-normal">{exercise.primary_muscles}</div>}
                  variant="accent"
                />
              )}
              
              {exercise.key_aspects && (
                <InfoCard
                  icon={Zap}
                  label="Key Aspects"
                  value={
                    <ul className="space-y-1.5 text-sm">
                      {exercise.key_aspects.split('\n').map((aspect, idx) => (
                        <li key={idx}>• {aspect}</li>
                      ))}
                    </ul>
                  }
                  variant="accent"
                />
              )}
              
              {(exercise.suggested_sets || exercise.suggested_reps || exercise.suggested_weight) && (
                <div className="lg:mt-[10px] lg:pt-[10px]">
                  <p className="text-base font-medium text-foreground mb-4">Suggested Program</p>
                  <div className="grid grid-cols-3 gap-3">
                    {exercise.suggested_sets && <ProgramTile label="Sets" value={exercise.suggested_sets.toString()} />}
                    {exercise.suggested_reps && <ProgramTile label="Reps" value={exercise.suggested_reps} />}
                    {exercise.suggested_weight && <ProgramTile label="Weight" value={exercise.suggested_weight} />}
                  </div>
                </div>
              )}

              {exercise.common_mistakes && (
                <InfoCard
                  icon={AlertTriangle}
                  label="Common Mistakes"
                  value={<div className="text-sm font-normal">{exercise.common_mistakes}</div>}
                  variant="accent"
                />
              )}
            </div>
          </div>

          {/* Workout Metrics - Full Width on Desktop */}
          <div className="hidden lg:block mt-8">
            <p className="text-base font-medium text-foreground mb-4">Workout Metrics Based on Suggested Program</p>
            <div className="grid grid-cols-3 gap-4">
              <InfoCard
                icon={Flame}
                label="Calories Burned"
                value={
                  <div className="text-sm font-normal space-y-1">
                    <div>Per set: ~6–8 calories</div>
                    <div>Total (4 sets): ~25–35 calories</div>
                    <div>With rest: ~40–60 calories total</div>
                  </div>
                }
                variant="accent"
              />
              <InfoCard
                icon={Weight}
                label="Total Volume"
                value={<div className="text-sm font-normal">Calculated based on your program</div>}
                variant="accent"
              />
              <InfoCard
                icon={Clock}
                label="Time Under Tension"
                value={<div className="text-sm font-normal">~1 min total (3 s eccentric + 1 s concentric per rep)</div>}
                variant="accent"
              />
              <InfoCard
                icon={Heart}
                label="Heart Rate Range"
                value={<div className="text-sm font-normal">~120–150 bpm (moderate intensity)</div>}
                variant="accent"
              />
              <InfoCard
                icon={Activity}
                label="Metabolic Equivalent (MET)"
                value={<div className="text-sm font-normal">~6 METs (strength training, moderate–vigorous)</div>}
                variant="accent"
              />
              <InfoCard
                icon={TrendingUp}
                label="Calories/minute"
                value={<div className="text-sm font-normal">~5–8 cal/min (based on bodyweight)</div>}
                variant="accent"
              />
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />

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

export default ExerciseDetail;
