import { useState } from "react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Dumbbell, CheckCircle2, Circle, Clock, Loader2, Moon, Sun, Play } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientRoutineAssignments } from "@/hooks/useRoutineAssignments";
import { useWorkoutSessions, useStartWorkoutSession } from "@/hooks/useWorkoutSessions";

const MyWorkouts = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { data: assignments, isLoading: assignmentsLoading } = useClientRoutineAssignments();
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions();
  const startWorkout = useStartWorkoutSession();
  const [startingRoutineId, setStartingRoutineId] = useState<string | null>(null);

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];

  const handleStartWorkout = async (routineId: string) => {
    console.log('Start clicked, routineId:', routineId);
    setStartingRoutineId(routineId);
    try {
      const session = await startWorkout.mutateAsync(routineId);
      console.log('Session created:', session);
      navigate(`/workouts/session/${session.id}`);
    } catch (error) {
      console.error('Failed to start workout:', error);
      setStartingRoutineId(null);
    }
  };

  const handleReviewWorkout = (routineId: string) => {
    console.log('Review clicked, routineId:', routineId);
    const lastSession = completedSessions.find(s => s.routine_id === routineId);
    if (lastSession) {
      navigate(`/workouts/history/${lastSession.id}`);
    }
  };

  // Transform assignments into workouts format
  const workouts = assignments?.map((assignment: any) => {
    const routine = assignment.routines;
    const exerciseCount = routine?.routine_exercises?.length || 0;
    const completedForRoutine = completedSessions.filter(s => s.routine_id === routine?.id);
    const pausedSession = sessions?.find(s => s.routine_id === routine?.id && s.status === "paused");
    const lastCompleted = completedForRoutine[0];
    
    // Count unique exercises completed in the most recent session
    let completedExercises = 0;
    const completedExerciseIds = new Set<string>();
    if (lastCompleted?.set_logs) {
      lastCompleted.set_logs.forEach((log: any) => completedExerciseIds.add(log.exercise_id));
      completedExercises = completedExerciseIds.size;
    }
    
    // Map exercises with completion status
    const exerciseList = routine?.routine_exercises?.map((re: any) => ({
      id: re.exercise_id,
      name: re.exercises?.title || "Unknown Exercise",
      isCompleted: completedExerciseIds.has(re.exercise_id)
    })) || [];
    
    let status = "not_started";
    if (pausedSession) {
      status = "paused";
    } else if (lastCompleted) {
      status = "completed";
    }
    
    return {
      id: routine?.id,
      title: routine?.name || "Untitled Workout",
      description: routine?.description || "No description",
      exercises: exerciseCount,
      completed: completedExercises,
      status,
      pausedSessionId: pausedSession?.id,
      assignedDate: assignment.assigned_at || assignment.created_at,
      exerciseList
    };
  }) || [];

  const getStatusIcon = (status: string, completed: number, total: number) => {
    if (status === "paused") {
      return <Play className="w-5 h-5 text-yellow-500" />;
    } else if (status === "completed" || completed === total) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (completed > 0) {
      return <Clock className="w-5 h-5 text-primary" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "paused") {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Paused</Badge>;
    } else if (status === "completed") {
      return <Badge className="bg-green-600">Completed</Badge>;
    } else if (status === "in_progress") {
      return <Badge className="bg-primary">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      <BottomNav />

      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50 lg:top-6 lg:right-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="glass border-border/50 hover:bg-primary/10"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">My Workouts</h1>
              <p className="text-muted-foreground">
                {workouts.length} {workouts.length === 1 ? "program" : "programs"} assigned by your coach
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(assignmentsLoading || sessionsLoading) ? (
          <div className="glass rounded-2xl p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : workouts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No workouts assigned yet</h2>
            <p className="text-muted-foreground mb-6">
              Your coach will assign exercises to help you reach your goals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="glass rounded-2xl p-6 transition-smooth hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:bg-white/70 dark:hover:bg-black/60 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(workout.status, workout.completed, workout.exercises)}
                    <div>
                      <h3 className="font-bold text-lg mb-1">{workout.title}</h3>
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(workout.status)}
                </div>

                {/* Progress */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exercises</span>
                    <span className="font-semibold">
                      {workout.completed}/{workout.exercises}
                    </span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary rounded-full h-2 transition-all max-w-full"
                      style={{
                        width: `${Math.min((workout.completed / workout.exercises) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  
                  {/* Exercise Completion List */}
                  {workout.exerciseList && workout.exerciseList.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {workout.exerciseList.map((exercise: any) => (
                        <div key={exercise.id} className="flex items-center gap-2 text-sm">
                          {exercise.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={exercise.isCompleted ? "text-foreground" : "text-muted-foreground"}>
                            {exercise.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Assigned {new Date(workout.assignedDate).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm" 
                    variant={workout.status === "completed" ? "outline" : workout.status === "paused" ? "default" : "default"}
                    onClick={() => {
                      if (workout.status === "completed") {
                        handleReviewWorkout(workout.id);
                      } else if (workout.status === "paused" && workout.pausedSessionId) {
                        // Navigate directly to the paused session
                        navigate(`/workouts/session/${workout.pausedSessionId}`);
                      } else {
                        handleStartWorkout(workout.id);
                      }
                    }}
                    disabled={startingRoutineId === workout.id}
                    className={workout.status === "paused" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700" : ""}
                  >
                    {startingRoutineId === workout.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {workout.status === "paused" ? "Resuming..." : "Starting..."}
                      </>
                    ) : (
                      <>
                        {workout.status === "paused" && <Play className="w-4 h-4 mr-2" />}
                        {workout.status === "completed" ? "Review" : workout.status === "paused" ? "Resume" : "Start"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyWorkouts;
