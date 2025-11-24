import { Calendar, Download, Dumbbell, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientRecentActivity } from "@/hooks/useClientRecentActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ClientHistoryTabProps {
  clientId: string;
}

export const ClientHistoryTab = ({ clientId }: ClientHistoryTabProps) => {
  const { activities, isLoading } = useClientRecentActivity(clientId);

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

  const getActivityColor = (type: string) => {
    switch (type) {
      case "workout_assigned":
        return "text-blue-500";
      case "workout_completed":
        return "text-green-500";
      case "session_scheduled":
        return "text-orange-500";
      case "message_sent":
        return "text-purple-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Complete Activity History</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="glass rounded-2xl p-6">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()} •{" "}
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No training history yet</h3>
          <p className="text-muted-foreground">
            Activity logs will appear here as the client interacts with their training plan
          </p>
        </div>
      )}
    </div>
  );
};
