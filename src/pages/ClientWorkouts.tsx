import { useNavigate } from "react-router-dom";
import { useClientRoutineAssignments } from "@/hooks/useRoutineAssignments";
import { useWorkoutSessions, useStartWorkoutSession } from "@/hooks/useWorkoutSessions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Play, Clock, Dumbbell, Loader2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ClientWorkouts() {
  const navigate = useNavigate();
  const { data: assignments, isLoading: assignmentsLoading } = useClientRoutineAssignments();
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions();
  const startWorkout = useStartWorkoutSession();

  console.log('📊 ClientWorkouts Data:', { assignments, sessions, assignmentsLoading, sessionsLoading });

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];

  const handleStartWorkout = async (routineId: string) => {
    console.log('🔥 START CLICKED! routineId:', routineId);
    try {
      console.log('🔥 Calling startWorkout mutation...');
      const session = await startWorkout.mutateAsync(routineId);
      console.log('🔥 Session created:', session);
      console.log('🔥 Navigating to:', `/workouts/session/${session.id}`);
      navigate(`/workouts/session/${session.id}`);
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (assignmentsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Workouts</h1>

      {/* Available Routines */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Available Routines</h2>

        {assignments && assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment: any) => {
              const routine = assignment.routines;
              const exerciseCount = routine?.routine_exercises?.length || 0;
              const lastCompleted = completedSessions.find(
                (s) => s.routine_id === routine?.id
              );

              console.log('🎯 Rendering routine card:', { 
                assignmentId: assignment.id, 
                routineId: routine?.id, 
                routineName: routine?.name,
                exerciseCount 
              });

              return (
                <Card
                  key={assignment.id}
                  className="p-6 bg-card border-border hover:border-primary/50 transition-all"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {routine?.name}
                      </h3>
                      {routine?.description && (
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Dumbbell className="w-4 h-4" />
                      <span>{exerciseCount} exercises</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Assigned by:</span>
                      <UserAvatar
                        fullName={assignment.profiles?.full_name}
                        avatarUrl={assignment.profiles?.avatar_url}
                        userId={assignment.profiles?.id}
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-foreground">
                        {assignment.profiles?.full_name}
                      </span>
                    </div>

                    {lastCompleted && (
                      <div className="text-xs text-muted-foreground">
                        Last completed: {formatDistanceToNow(new Date(lastCompleted.completed_at!), { addSuffix: true })}
                      </div>
                    )}

                    {assignment.notes && (
                      <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
                        "{assignment.notes}"
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        console.log('🎯 Button clicked! Routine ID:', routine?.id);
                        if (!routine?.id) {
                          console.error('❌ No routine ID available!');
                          return;
                        }
                        handleStartWorkout(routine.id);
                      }}
                      className="w-full"
                      disabled={startWorkout.isPending || !routine?.id}
                    >
                      {startWorkout.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Workout
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground mb-2">No workouts assigned yet</p>
            <p className="text-sm text-muted-foreground">
              Your coach will assign workout routines for you to complete
            </p>
          </Card>
        )}
      </section>

      {/* Workout History */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Workout History</h2>

        {completedSessions.length > 0 ? (
          <div className="space-y-3">
            {completedSessions.slice(0, 10).map((session: any) => (
              <Card
                key={session.id}
                className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate(`/workouts/history/${session.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {session.routines?.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(session.completed_at!).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.duration_minutes ? `${session.duration_minutes} min` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium">
                    View Details →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">No completed workouts yet</p>
          </Card>
        )}
      </section>
    </div>
  );
}
