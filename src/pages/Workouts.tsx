import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoachWorkouts, useDeleteCoachWorkout } from "@/hooks/useCoachWorkouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Users, Loader2, Moon, Sun } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssignWorkoutModal } from "@/components/Workouts/AssignWorkoutModal";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";

export default function Workouts() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { data: workouts, isLoading } = useCoachWorkouts();
  const deleteWorkout = useDeleteCoachWorkout();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [workoutToAssign, setWorkoutToAssign] = useState<{ id: string; name: string } | null>(null);

  const filteredWorkouts = workouts?.filter((workout) =>
    workout.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setWorkoutToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (workoutToDelete) {
      await deleteWorkout.mutateAsync(workoutToDelete);
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  };

  return (
    <div 
      className="min-h-screen flex w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      <BottomNav />
      
      <main className="flex-1 lg:ml-20 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-7xl">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="fixed top-4 right-4 glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground z-50"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Workouts</h1>
          <p className="text-muted-foreground mt-1">Create and manage workouts</p>
        </div>
        <Button
          onClick={() => navigate("/workouts/create")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Workout
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search workouts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Workouts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredWorkouts && filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout) => (
            <Card
              key={workout.id}
              className="p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/workouts/${workout.id}`)}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {workout.name}
                  </h3>
                  {workout.description && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                      {workout.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    exercises
                  </span>
                  <span>
                    {new Date(workout.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/workouts/${workout.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setWorkoutToAssign({ id: workout.id, name: workout.name });
                      setAssignModalOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(workout.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No workouts found matching your search" : "No workouts yet. Create your first workout to get started!"}
          </p>
          <Button onClick={() => navigate("/workouts/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Workout
          </Button>
        </div>
      )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Workout Modal */}
      {workoutToAssign && (
        <AssignWorkoutModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          workoutId={workoutToAssign.id}
          workoutName={workoutToAssign.name}
        />
      )}
    </div>
  );
}
