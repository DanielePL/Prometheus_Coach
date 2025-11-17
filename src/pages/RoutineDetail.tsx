import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoutine } from "@/hooks/useRoutines";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Users, Loader2, Moon, Sun } from "lucide-react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import { AssignRoutineModal } from "@/components/Routines/AssignRoutineModal";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";

export default function RoutineDetail() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { data: routine, isLoading } = useRoutine(routineId);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex w-full items-center justify-center"
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

  if (!routine && !isLoading) {
    console.error("Routine not found for ID:", routineId);
    return (
      <div 
        className="min-h-screen flex w-full items-center justify-center"
        style={{
          backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Routine not found</h2>
          <p className="text-muted-foreground mb-4">The routine you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/routines")} variant="outline" className="mt-4">
            Back to Routines
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-4xl">
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

          <Button variant="ghost" onClick={() => navigate("/routines")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Routines
          </Button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{routine.name}</h1>
          {routine.description && (
            <p className="text-muted-foreground mt-2">{routine.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setAssignModalOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Assign to Clients
          </Button>
          <Button onClick={() => navigate(`/routines/${routineId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

      </div>

      {/* Assign Routine Modal */}
      <AssignRoutineModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        routineId={routineId!}
        routineName={routine.name}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Exercises</h2>
        {routine.routine_exercises && routine.routine_exercises.length > 0 ? (
          routine.routine_exercises.map((re: any, index: number) => (
            <Card key={re.id} className="p-4 bg-card border-border">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {index + 1}
                </div>
                
                {re.exercises?.thumbnail_url && (
                  <img
                    src={re.exercises.thumbnail_url}
                    alt={re.exercises.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{re.exercises?.title}</h3>
                  <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                    <span>{re.sets} sets</span>
                    {re.reps_min && re.reps_max ? (
                      <span>{re.reps_min}-{re.reps_max} reps</span>
                    ) : re.reps_min ? (
                      <span>{re.reps_min} reps</span>
                    ) : null}
                    <span>{re.rest_seconds}s rest</span>
                  </div>
                  {re.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">{re.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">No exercises in this routine</p>
          </Card>
        )}
      </div>
        </div>
      </main>
    </div>
  );
}
