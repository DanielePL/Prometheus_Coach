import { TrendingUp, Flame, Calendar, Dumbbell, Activity, MessageSquare } from "lucide-react";
import { useClientProgress } from "@/hooks/useClientProgress";
import { useClientWorkouts } from "@/hooks/useClientWorkouts";
import { useClientRecentActivity } from "@/hooks/useClientRecentActivity";
import { useClientUpcomingSessions } from "@/hooks/useClientUpcomingSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ClientOverviewTabProps {
  clientId: string;
}

export const ClientOverviewTab = ({ clientId }: ClientOverviewTabProps) => {
  const { data: progress, isLoading: progressLoading } = useClientProgress(clientId);
  const { data: workouts, isLoading: workoutsLoading } = useClientWorkouts(clientId);
  const { activities: recentActivity, isLoading: activityLoading } = useClientRecentActivity(clientId);
  const { sessions: upcomingSessions, isLoading: sessionsLoading } = useClientUpcomingSessions(clientId);

  const totalSessions = workouts?.filter((w) => w.status === "completed").length || 0;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "workout_assigned":
        return Dumbbell;
      case "workout_completed":
        return Activity;
      case "session_scheduled":
        return Calendar;
      case "message_sent":
        return MessageSquare;
      default:
        return Activity;
    }
  };

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
        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent activity to display</p>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Upcoming Sessions</h3>
        {sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : upcomingSessions && upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.start_time).toLocaleDateString()} at{" "}
                    {new Date(session.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming sessions scheduled</p>
        )}
      </div>
    </div>
  );
};
