import { Plus, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientWorkouts } from "@/hooks/useClientWorkouts";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientWorkoutsTabProps {
  clientId: string;
}

const statusColors = {
  not_started: "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50",
  in_progress: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50",
  completed: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
};

export const ClientWorkoutsTab = ({ clientId }: ClientWorkoutsTabProps) => {
  const { data: workouts, isLoading } = useClientWorkouts(clientId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assigned Workouts</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Assign New Workout
        </Button>
      </div>

      {workouts && workouts.length > 0 ? (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div key={workout.id} className="glass rounded-2xl p-6 transition-smooth hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{workout.title}</h3>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[workout.status as keyof typeof statusColors]}>
                  {workout.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Assigned: {new Date(workout.created_at).toLocaleDateString()}
                </span>
                {workout.exercises && Array.isArray(workout.exercises) && (
                  <span>
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No workouts assigned yet</h3>
          <p className="text-muted-foreground mb-6">
            Assign a workout to get this client started
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Assign First Workout
          </Button>
        </div>
      )}
    </div>
  );
};
