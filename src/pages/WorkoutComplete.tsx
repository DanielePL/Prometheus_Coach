import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkoutSession, useCompleteWorkoutSession } from "@/hooks/useWorkoutSessions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { useTheme } from "next-themes";
import confetti from "canvas-confetti";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";

export default function WorkoutComplete() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [clientNotes, setClientNotes] = useState("");
  const { data: session, isLoading } = useWorkoutSession(sessionId);
  const completeSession = useCompleteWorkoutSession();

  // Celebrate with confetti on mount
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ["#FF6B35", "#FF8F6B", "#FFA07A"],
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const routineExercises = session.routines?.routine_exercises || [];
  const setLogs = session.set_logs || [];
  
  const exercisesCompleted = new Set(setLogs.map((log: any) => log.exercise_id)).size;
  const setsCompleted = setLogs.filter((log: any) => log.completed).length;
  
  // Calculate total volume (weight × reps)
  const totalVolume = setLogs.reduce((sum: number, log: any) => {
    if (log.completed && log.weight_used && log.reps_completed) {
      return sum + (log.weight_used * log.reps_completed);
    }
    return sum;
  }, 0);

  // Calculate duration
  const startTime = new Date(session.started_at).getTime();
  const endTime = Date.now();
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  const durationMinutes = Math.floor(durationSeconds / 60);

  const handleFinish = async () => {
    await completeSession.mutateAsync({
      sessionId: session.id,
      clientNotes: clientNotes || undefined,
      durationSeconds,
    });

    navigate("/workouts");
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Workout Complete!</h1>
          <p className="text-xl text-muted-foreground">
            Great job crushing that workout! 🎉
          </p>
        </div>

        {/* Summary Stats */}
        <div className="glass rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="text-2xl font-bold mb-4">{session.routines?.name}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">{durationMinutes} min</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Exercises</p>
                <p className="text-2xl font-bold">
                  {exercisesCompleted}/{routineExercises.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Dumbbell className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sets</p>
                <p className="text-2xl font-bold">{setsCompleted}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{totalVolume.toLocaleString()} lbs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Notes */}
        <div className="glass rounded-2xl p-6 mb-6">
          <Label className="text-lg font-semibold mb-2">How did you feel?</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Add notes about this workout (optional)
          </p>
          <Textarea
            placeholder="I felt strong today! The last set was challenging but I pushed through..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            rows={4}
          />
        </div>

        {/* Actions */}
        <Button
          onClick={handleFinish}
          disabled={completeSession.isPending}
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
        >
          {completeSession.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Finish & Save"
          )}
        </Button>
      </main>
    </div>
  );
}
