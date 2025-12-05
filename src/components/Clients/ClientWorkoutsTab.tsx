import { useNavigate } from "react-router-dom";
import { useClientWorkoutSessions } from "@/hooks/useClientWorkoutSessions";
import { format } from "date-fns";
import { Clock, Dumbbell, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientWorkoutsTabProps {
  clientId: string;
}

const statusColors = {
  not_started: "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50",
  in_progress: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50",
  completed: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
};

export const ClientWorkoutsTab = ({ clientId }: ClientWorkoutsTabProps) => {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useClientWorkoutSessions(clientId);

  const clientSessions = sessions?.filter(
    (session) => session.status === "completed"
  ) || [];

  const totalWorkouts = clientSessions.length;
  const totalDuration = clientSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.floor(totalDuration / totalWorkouts / 60) : 0;
  const totalVolume = clientSessions.reduce((sum: number, session: any) => {
    const setLogs = session.set_logs || [];
    return sum + setLogs.reduce((s: number, log: any) => {
      if (log.completed && log.weight_used && log.reps_completed) {
        return s + (log.weight_used * log.reps_completed);
      }
      return s;
    }, 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clientSessions.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No completed workouts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <Dumbbell className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{totalWorkouts}</p>
          <p className="text-sm text-muted-foreground">Workouts</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{avgDuration}</p>
          <p className="text-sm text-muted-foreground">Avg Minutes</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}k</p>
          <p className="text-sm text-muted-foreground">Total Volume</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Workout History</h3>
        <div className="space-y-3">
          {clientSessions.map((session: any) => {
            const setLogs = session.set_logs || [];
            const sessionVolume = setLogs.reduce((sum: number, log: any) => {
              if (log.completed && log.weight_used && log.reps_completed) {
                return sum + (log.weight_used * log.reps_completed);
              }
              return sum;
            }, 0);
            const routineExercises = session.routines?.routine_exercises || [];
            const completedExercises = new Set(setLogs.map((log: any) => log.exercise_id)).size;
            const completionRate = routineExercises.length > 0 ? Math.round((completedExercises / routineExercises.length) * 100) : 0;

            return (
              <div key={session.id} className="glass rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate(`/workouts/history/${session.id}`)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{session.routines?.name}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(session.completed_at || session.started_at), "PPP")}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">{completionRate}% Complete</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor((session.duration_seconds || 0) / 60)} min</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" />{setLogs.length} sets</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" />{sessionVolume.toLocaleString()} lbs</span>
                </div>
                {session.client_notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-1">"{session.client_notes}"</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
