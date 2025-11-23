import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkoutSession, useCompleteWorkoutSession } from "@/hooks/useWorkoutSessions";
import { useSaveSetLog } from "@/hooks/useSetLogs";
import { usePreviousPerformance } from "@/hooks/usePreviousPerformance";
import { usePersonalRecord, useSavePersonalRecord, checkIsPR } from "@/hooks/usePersonalRecords";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { ChevronLeft, ChevronRight, X, Loader2, Timer, Plus, Minus, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function WorkoutSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: session, isLoading } = useWorkoutSession(sessionId);
  const completeWorkout = useCompleteWorkoutSession();
  const saveSetLog = useSaveSetLog();
  const savePersonalRecord = useSavePersonalRecord();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [setData, setSetData] = useState<Record<string, { weight: string; reps: string; completed: boolean }>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState("");
  const [prAchieved, setPrAchieved] = useState<{ exerciseName: string; weight: number; reps: number } | null>(null);

  const exercises = session?.routines?.routine_exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // Default rest time if not specified
  const DEFAULT_REST_SECONDS = 90;

  // Fetch previous performance for current exercise
  const { data: previousPerformance } = usePreviousPerformance(
    currentExercise?.exercise_id || "",
    sessionId || ""
  );

  // Fetch current PR for current exercise
  const { data: currentPR } = usePersonalRecord(
    user?.id || "",
    currentExercise?.exercise_id || ""
  );

  // Audio for rest timer completion
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist and restore timer state
  useEffect(() => {
    if (!sessionId) return;
    
    const savedStartTime = localStorage.getItem(`workout_${sessionId}_start`);
    if (savedStartTime) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStartTime)) / 1000);
      setElapsedSeconds(elapsed);
    } else if (session?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
      setElapsedSeconds(elapsed);
      localStorage.setItem(`workout_${sessionId}_start`, new Date(session.started_at).getTime().toString());
    }
  }, [sessionId, session]);

  // Elapsed timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Navigation prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session?.status === "in_progress") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  // Rest timer countdown with alerts
  useEffect(() => {
    if (restTimer === null) return;
    
    if (restTimer <= 0) {
      // Rest complete - play sound and vibrate
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      setRestTimer(null);
      return;
    }
    
    const interval = setInterval(() => {
      setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetChange = async (setNumber: number, field: "weight" | "reps", value: string) => {
    const key = `${currentExercise.exercise_id}-${setNumber}`;
    const updated = { ...setData[key], [field]: value };
    setSetData((prev) => ({ ...prev, [key]: updated }));
  };

  const handleSetComplete = async (setNumber: number) => {
    const key = `${currentExercise.exercise_id}-${setNumber}`;
    const current = setData[key] || { weight: "", reps: "", completed: false };
    const newCompleted = !current.completed;

    setSetData((prev) => ({ ...prev, [key]: { ...current, completed: newCompleted } }));

    const weight = parseFloat(current.weight) || 0;
    const reps = parseInt(current.reps) || 0;

    // Check for PR when completing a set
    if (newCompleted && weight > 0 && reps > 0) {
      const isPR = checkIsPR(currentPR, weight, reps);
      
      if (isPR) {
        // Save PR to database
        await savePersonalRecord.mutateAsync({
          client_id: user!.id,
          exercise_id: currentExercise.exercise_id,
          weight_used: weight,
          reps_completed: reps,
          session_id: sessionId!,
        });

        // Trigger celebration
        setPrAchieved({
          exerciseName: currentExercise.exercises.title,
          weight,
          reps,
        });

        // Confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FF6B35", "#FF8F6B", "#FFB088"],
        });

        // Toast notification
        toast.success(`🏆 New Personal Record!`, {
          description: `${weight} lbs × ${reps} reps on ${currentExercise.exercises.title}`,
        });

        // Auto-dismiss PR badge after 5 seconds
        setTimeout(() => setPrAchieved(null), 5000);
      }
    }

    // Save to database
    await saveSetLog.mutateAsync({
      session_id: sessionId!,
      exercise_id: currentExercise.exercise_id,
      set_number: setNumber,
      reps_completed: current.reps ? parseInt(current.reps) : null,
      weight_used: current.weight ? parseFloat(current.weight) : null,
      completed: newCompleted,
    });

    // Start rest timer if completing a set
    if (newCompleted) {
      const restTime = currentExercise.rest_seconds || DEFAULT_REST_SECONDS;
      setRestTimer(restTime);
      localStorage.setItem(`workout_${sessionId}_rest`, restTime.toString());
    }
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setRestTimer(null);
    } else {
      // All exercises complete - go to workout complete page
      navigate(`/workouts/complete/${sessionId}`);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setRestTimer(null);
    }
  };

  const skipRestTimer = () => {
    setRestTimer(null);
    if (sessionId) {
      localStorage.removeItem(`workout_${sessionId}_rest`);
    }
  };

  const addRestTime = (seconds: number) => {
    setRestTimer((prev) => (prev || 0) + seconds);
  };

  const handleCompleteWorkout = async () => {
    await completeWorkout.mutateAsync({
      sessionId: sessionId!,
      clientNotes,
      durationSeconds: elapsedSeconds,
    });
    // Clean up localStorage
    if (sessionId) {
      localStorage.removeItem(`workout_${sessionId}_start`);
      localStorage.removeItem(`workout_${sessionId}_rest`);
    }
    navigate("/workouts");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !currentExercise) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">{session.routines?.name}</h1>
        <Button variant="ghost" onClick={() => setEndDialogOpen(true)}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Rest Timer with Circular Progress */}
      {restTimer !== null && restTimer > 0 && (
        <Card className="p-6 mb-6 bg-primary/10 border-primary text-center">
          <p className="text-sm text-muted-foreground mb-2">Rest Time</p>
          
          {/* Circular Progress Indicator */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - restTimer / (currentExercise.rest_seconds || DEFAULT_REST_SECONDS))}`}
                  className={`transition-all duration-1000 ${
                    restTimer < 10 ? "text-destructive" : 
                    restTimer < 30 ? "text-yellow-500" : 
                    "text-primary"
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-3xl font-bold text-primary">{formatTime(restTimer)}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            Recommended: {formatTime(currentExercise.rest_seconds || DEFAULT_REST_SECONDS)}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRestTime(-15)}
              disabled={restTimer <= 15}
            >
              <Minus className="w-4 h-4 mr-1" />
              15s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={skipRestTimer}
            >
              Skip Rest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRestTime(15)}
            >
              <Plus className="w-4 h-4 mr-1" />
              15s
            </Button>
          </div>
        </Card>
      )}

      {/* Hidden audio element for rest timer */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS76+eeSBELTqXh8bVjGwU6kdvy0H4yBSR2x/DdkEAKE12z6OqoVRQLRp/g8r5uIQUsgs/y2Ik2CBdju+vnm0gRC06l4fC1YxsFOpHb8s9+MgUkdsfw3JBBChNds+jqqFUVC0af4PK+biEFLILP8tmJNggXY7zs5ptJEQtOpeHwtGMbBTuR2/LPfjIFJHbH8NyQQQoTXbPo6qhVFQtGn+DyvW4hBSyCz/LZiTUIFmK87OWbSRELTqXh8LRjGwU7kdvyz34yBSR2x/DckEEKE12z6OqoVRULRp/g8r1uIQUsgs/y2Yk1CBZivOzlm0kRC06l4fC0YxsFO5Hb8s5+MgUkdsfv3JBBChNds+jqqFUVC0af4PK9biEFLILP8tmJNQgWYrzs5ZtJEQtOpeHwtGMbBTuR2/LOfTIFJHbH79yQQQoTXbPo6qhVFQtGn+DyvW4hBSyCz/LZiTUIFmK87OWbSRELTqXh8LRjGwU7kdvyzn0yBSR2x+/ckEEKE12z6OqoVRULRp/g8r1uIQUsgs/y2Yk1CBZivOzlm0kRC06l4fC0YxsFO5Hb8s59MgUkdsfv3JBBChNds+jqqFUVC0af4PK9biEFLILP8tmJNQgWYrzs5ZtJEQtOpeHwtGMbBTuR2/LOfTIFJHbH79yQQQoTXbPo6qhVFQtGn+DyvW4hBSyCz/LZiTUIFmK87OWbSRELTqXh8LRjGwU7kdvyzn0yBSR2x+/ckEEKE12z6OqoVRULRp/g8r1uIQUsgs/y2Yk1CBZivOzlm0kRC06l4fC0YxsFO5Hb8s59MgUkdsfv3JBBChNds+jqqFUVC0af4PK9biEFLILP8tmJNQgWYrzs5ZtJEQtOpeHwtGMbBTuR2/LOfTIFJHbH79yQQQoTXbPo6qhVFQtGn+DyvW4hBSyC" preload="auto"></audio>

      {/* Current Exercise */}
      <Card className="p-6 mb-6 bg-card border-border">
        <div className="space-y-6">
          {/* Exercise Info */}
          <div className="flex gap-4">
            {currentExercise.exercises?.thumbnail_url && (
              <img
                src={currentExercise.exercises.thumbnail_url}
                alt={currentExercise.exercises.title}
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  {currentExercise.exercises?.title}
                </h2>
                {prAchieved && prAchieved.exerciseName === currentExercise.exercises.title && (
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white animate-pulse">
                    <Trophy className="w-4 h-4 mr-1" />
                    New PR!
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-sm space-y-1">
                <p>Target: {currentExercise.sets} sets × {currentExercise.reps_min}-{currentExercise.reps_max} reps</p>
                {currentPR && (
                  <p className="text-primary font-semibold">
                    Current PR: {currentPR.weight_used} lbs × {currentPR.reps_completed} reps
                  </p>
                )}
                {currentExercise.notes && (
                  <p className="italic">"{currentExercise.notes}"</p>
                )}
              </div>
              
              {/* Previous Performance */}
              {previousPerformance && previousPerformance.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Last Performance:</p>
                  <div className="flex gap-3 text-sm flex-wrap">
                    {previousPerformance.map((log: any, idx: number) => (
                      <span key={idx} className="text-foreground">
                        Set {log.set_number}: {log.weight_used ? `${log.weight_used} lbs` : '-'} × {log.reps_completed || '-'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Set Logging */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Log Your Sets</p>
            {Array.from({ length: currentExercise.sets }).map((_, i) => {
              const setNumber = i + 1;
              const key = `${currentExercise.exercise_id}-${setNumber}`;
              const current = setData[key] || { weight: "", reps: "", completed: false };

              return (
                <Card key={setNumber} className={`p-4 ${current.completed ? "bg-primary/5 border-primary/50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={current.completed}
                      onCheckedChange={() => handleSetComplete(setNumber)}
                    />
                    <span className="font-semibold w-16">Set {setNumber}</span>
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={current.weight}
                      onChange={(e) => handleSetChange(setNumber, "weight", e.target.value)}
                      className="w-24"
                      disabled={current.completed}
                    />
                    <span className="text-muted-foreground">lbs ×</span>
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={current.reps}
                      onChange={(e) => handleSetChange(setNumber, "reps", e.target.value)}
                      className="w-24"
                      disabled={current.completed}
                    />
                    <span className="text-muted-foreground">reps</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={goToPreviousExercise}
          disabled={currentExerciseIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={goToNextExercise} className="flex-1">
          {currentExerciseIndex === totalExercises - 1 ? "Finish Workout" : "Next Exercise"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* End Workout Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Workout Early?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this workout? Your progress will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Workout</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (sessionId) {
                localStorage.removeItem(`workout_${sessionId}_start`);
                localStorage.removeItem(`workout_${sessionId}_rest`);
              }
              navigate("/workouts");
            }}>
              End Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Workout Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workout Complete! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              Great job! How did you feel about this workout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional notes about your workout..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCompleteWorkout}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
