import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkoutSession, useCompleteWorkoutSession } from "@/hooks/useWorkoutSessions";
import { useSaveSetLog } from "@/hooks/useSetLogs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import { ChevronLeft, ChevronRight, X, Loader2, Timer } from "lucide-react";

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useWorkoutSession(id);
  const completeWorkout = useCompleteWorkoutSession();
  const saveSetLog = useSaveSetLog();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [setData, setSetData] = useState<Record<string, { weight: string; reps: string; completed: boolean }>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState("");

  const exercises = session?.routines?.routine_exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // Elapsed timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
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

    // Save to database
    await saveSetLog.mutateAsync({
      session_id: id!,
      exercise_id: currentExercise.exercise_id,
      set_number: setNumber,
      reps_completed: current.reps ? parseInt(current.reps) : null,
      weight_used: current.weight ? parseFloat(current.weight) : null,
      completed: newCompleted,
    });

    // Start rest timer if completing a set
    if (newCompleted) {
      setRestTimer(currentExercise.rest_seconds);
    }
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setRestTimer(null);
    } else {
      // All exercises complete - go to workout complete page
      navigate(`/workouts/complete/${id}`);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setRestTimer(null);
    }
  };

  const handleCompleteWorkout = async () => {
    await completeWorkout.mutateAsync({
      sessionId: id!,
      clientNotes,
      durationSeconds: elapsedSeconds,
    });
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">{session.routines?.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
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

      {/* Rest Timer */}
      {restTimer !== null && restTimer > 0 && (
        <Card className="p-4 mb-6 bg-primary/10 border-primary text-center">
          <p className="text-sm text-muted-foreground mb-1">Rest Time</p>
          <p className="text-3xl font-bold text-primary">{formatTime(restTimer)}</p>
          <Button variant="ghost" size="sm" onClick={() => setRestTimer(null)} className="mt-2">
            Skip Rest
          </Button>
        </Card>
      )}

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
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {currentExercise.exercises?.title}
              </h2>
              <div className="text-muted-foreground text-sm space-y-1">
                <p>Target: {currentExercise.sets} sets × {currentExercise.reps_min}-{currentExercise.reps_max} reps</p>
                {currentExercise.notes && (
                  <p className="italic">"{currentExercise.notes}"</p>
                )}
              </div>
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
            <AlertDialogAction onClick={() => navigate("/workouts")}>
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
