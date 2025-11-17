import { useParams, useNavigate } from "react-router-dom";
import { useWorkoutSession } from "@/hooks/useWorkoutSessions";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, Dumbbell, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";

export default function WorkoutHistoryDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { data: session, isLoading } = useWorkoutSession(sessionId);

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

  // Group set logs by exercise
  const exerciseGroups = routineExercises.map((re: any) => {
    const logs = setLogs.filter((log: any) => log.exercise_id === re.exercise_id);
    const exerciseVolume = logs.reduce((sum: number, log: any) => {
      if (log.completed && log.weight_used && log.reps_completed) {
        return sum + (log.weight_used * log.reps_completed);
      }
      return sum;
    }, 0);

    return {
      exercise: re.exercises,
      logs,
      volume: exerciseVolume,
    };
  });

  const totalVolume = exerciseGroups.reduce((sum, group) => sum + group.volume, 0);
  const durationMinutes = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : 0;

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
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 glass"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>

          <div className="glass rounded-2xl p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{session.routines?.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>
                {format(new Date(session.completed_at || session.started_at), "PPP")}
              </span>
              <span>•</span>
              <span>
                {format(new Date(session.completed_at || session.started_at), "p")}
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{durationMinutes} min</p>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Dumbbell className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{setLogs.length}</p>
              <p className="text-sm text-muted-foreground">Sets</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalVolume.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">lbs Volume</p>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="space-y-4 mb-6">
            {exerciseGroups.map((group, index) => (
              <div key={index} className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  {group.exercise.thumbnail_url && (
                    <img
                      src={group.exercise.thumbnail_url}
                      alt={group.exercise.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {group.exercise.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Volume: {group.volume.toLocaleString()} lbs
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.logs.map((log: any, logIndex: number) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                    >
                      <span className="font-medium">Set {logIndex + 1}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {log.weight_used} lbs × {log.reps_completed} reps
                        </span>
                        {log.completed && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Client Notes */}
          {session.client_notes && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">Client Notes</h3>
              <p className="text-muted-foreground">{session.client_notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
