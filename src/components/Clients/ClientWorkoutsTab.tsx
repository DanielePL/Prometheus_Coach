import { useNavigate } from "react-router-dom";
import { useClientWorkoutSessions } from "@/hooks/useClientWorkoutSessions";
import { useClientTrainingSummary, useClientWorkoutHistory } from "@/hooks/useClientMobileWorkouts";
import { format } from "date-fns";
import { Clock, Dumbbell, TrendingUp, Loader2, Flame, Trophy, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientWorkoutsTabProps {
  clientId: string;
}

export const ClientWorkoutsTab = ({ clientId }: ClientWorkoutsTabProps) => {
  const navigate = useNavigate();

  // Mobile App data (preferred)
  const { data: trainingSummary, isLoading: summaryLoading } = useClientTrainingSummary(clientId);
  const { data: workoutHistory, isLoading: historyLoading } = useClientWorkoutHistory(clientId);

  // Fallback: Coach-assigned sessions
  const { data: sessions, isLoading: sessionsLoading } = useClientWorkoutSessions(clientId);

  const isLoading = summaryLoading || historyLoading || sessionsLoading;

  // Use Mobile App workout_history if available, otherwise fallback to workout_sessions
  const hasWorkoutHistory = workoutHistory && workoutHistory.length > 0;

  // Fallback calculations from workout_sessions
  const clientSessions = sessions?.filter(
    (session) => session.status === "completed"
  ) || [];

  const fallbackTotalWorkouts = clientSessions.length;
  const fallbackTotalDuration = clientSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
  const fallbackAvgDuration = fallbackTotalWorkouts > 0 ? Math.floor(fallbackTotalDuration / fallbackTotalWorkouts / 60) : 0;
  const fallbackTotalVolume = clientSessions.reduce((sum: number, session: any) => {
    // Mobile App uses workout_sets, Coach app used set_logs
    const sets = session.workout_sets || session.set_logs || [];
    return sum + sets.reduce((s: number, set: any) => {
      // Mobile App: reps, weight_kg, completed_at
      // Coach App: reps_completed, weight_used, completed
      const reps = set.reps ?? set.reps_completed ?? 0;
      const weight = set.weight_kg ?? set.weight_used ?? 0;
      const isCompleted = set.completed_at != null || set.completed === true;
      if (isCompleted && weight && reps) {
        return s + (weight * reps);
      }
      return s;
    }, 0);
  }, 0);

  // Use Mobile App summary if available, otherwise use calculated values
  const totalWorkouts = trainingSummary?.total_workouts ?? fallbackTotalWorkouts;
  const avgDuration = trainingSummary?.avg_workout_duration_minutes ?? fallbackAvgDuration;
  const totalVolume = trainingSummary?.total_volume_kg ?? fallbackTotalVolume;
  const currentStreak = trainingSummary?.current_streak_days ?? 0;
  const totalPRs = trainingSummary?.total_prs ?? 0;
  const weekWorkouts = trainingSummary?.week_workouts ?? 0;
  const monthWorkouts = trainingSummary?.month_workouts ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = hasWorkoutHistory || clientSessions.length > 0;

  if (!hasData) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No completed workouts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <Dumbbell className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{totalWorkouts}</p>
          <p className="text-sm text-muted-foreground">Workouts</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{Math.round(avgDuration || 0)}</p>
          <p className="text-sm text-muted-foreground">Avg Minutes</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}k</p>
          <p className="text-sm text-muted-foreground">Total Volume (kg)</p>
        </div>
      </div>

      {/* Additional Stats from Mobile App */}
      {trainingSummary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-xl font-bold">{totalPRs}</p>
            <p className="text-xs text-muted-foreground">Total PRs</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{weekWorkouts}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{monthWorkouts}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
      )}

      {/* Workout History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Workout History</h3>
        <div className="space-y-3">
          {hasWorkoutHistory ? (
            // Render from workout_history (Mobile App)
            workoutHistory.map((entry) => (
              <div
                key={entry.id}
                className="glass rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/workouts/history/${entry.session_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{entry.workout_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.completed_at), "PPP")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {entry.prs_achieved > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50">
                        {entry.prs_achieved} PR{entry.prs_achieved > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {entry.performance_score && (
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">
                        {Math.round(entry.performance_score)}% Score
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {entry.duration_minutes || 0} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {entry.total_sets} sets
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {entry.total_volume_kg.toLocaleString()} kg
                  </span>
                  {entry.avg_rpe && (
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      RPE {entry.avg_rpe.toFixed(1)}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    "{entry.notes}"
                  </p>
                )}
              </div>
            ))
          ) : (
            // Fallback: Render from workout_sessions
            clientSessions.map((session: any) => {
              // Mobile App uses workout_sets, Coach app used set_logs
              const sets = session.workout_sets || session.set_logs || [];
              const sessionVolume = sets.reduce((sum: number, set: any) => {
                const reps = set.reps ?? set.reps_completed ?? 0;
                const weight = set.weight_kg ?? set.weight_used ?? 0;
                const isCompleted = set.completed_at != null || set.completed === true;
                if (isCompleted && weight && reps) {
                  return sum + (weight * reps);
                }
                return sum;
              }, 0);
              const routineExercises = session.routines?.routine_exercises || [];
              const completedExercises = new Set(sets.map((set: any) => set.exercise_id)).size;
              const completionRate = routineExercises.length > 0
                ? Math.round((completedExercises / routineExercises.length) * 100)
                : 0;

              return (
                <div
                  key={session.id}
                  className="glass rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/workouts/history/${session.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">
                        {session.routines?.name || session.workout_name || "Workout"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.completed_at || session.started_at), "PPP")}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">
                      {completionRate}% Complete
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor((session.duration_seconds || (session.duration_minutes || 0) * 60 || 0) / 60)} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {sets.length} sets
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {sessionVolume.toLocaleString()} kg
                    </span>
                  </div>
                  {(session.client_notes || session.notes) && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                      "{session.client_notes || session.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
