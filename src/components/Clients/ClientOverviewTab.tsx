import { TrendingUp, Flame, Calendar, Dumbbell } from "lucide-react";
import { useClientProgress } from "@/hooks/useClientProgress";
import { useClientWorkouts } from "@/hooks/useClientWorkouts";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientOverviewTabProps {
  clientId: string;
}

export const ClientOverviewTab = ({ clientId }: ClientOverviewTabProps) => {
  const { data: progress, isLoading: progressLoading } = useClientProgress(clientId);
  const { data: workouts, isLoading: workoutsLoading } = useClientWorkouts(clientId);

  const totalSessions = workouts?.filter((w) => w.status === "completed").length || 0;

  if (progressLoading || workoutsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Dumbbell,
      label: "Total Sessions",
      value: totalSessions,
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: `${progress?.workoutCompletionRate || 0}%`,
      color: "text-green-500",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${progress?.currentStreak || 0} days`,
      color: "text-orange-500",
    },
    {
      icon: Calendar,
      label: "Last Workout",
      value: progress?.lastWorkoutDate
        ? new Date(progress.lastWorkoutDate).toLocaleDateString()
        : "Never",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <p className="text-muted-foreground">No recent activity to display</p>
      </div>

      {/* Upcoming Sessions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Upcoming Sessions</h3>
        <p className="text-muted-foreground">No upcoming sessions scheduled</p>
      </div>
    </div>
  );
};
