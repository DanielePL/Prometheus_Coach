import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCoachWorkout, useCreateCoachWorkout, useUpdateCoachWorkout } from "@/hooks/useCoachWorkouts";
import { useSaveWorkoutExercises, WorkoutExercise } from "@/hooks/useWorkoutExercises";
import { useExercises } from "@/hooks/useExercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, GripVertical, Trash2, Loader2, Search, Moon, Sun } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";

interface ExerciseInWorkout extends WorkoutExercise {
  exercise?: {
    id: string;
    title: string;
    thumbnail_url?: string | null;
  };
}

function SortableExerciseCard({ exercise, onUpdate, onRemove, index }: {
  exercise: ExerciseInWorkout;
  onUpdate: (updates: Partial<WorkoutExercise>) => void;
  onRemove: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.exercise_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 bg-card border-border transition-all ${
        isDragging 
          ? 'opacity-50 scale-105 shadow-lg ring-2 ring-primary/50' 
          : 'hover:border-primary/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Order Number Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {index + 1}
          </div>
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing hover:bg-primary/10 p-2 rounded-lg transition-colors group"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {exercise.exercise?.thumbnail_url && (
          <img
            src={exercise.exercise.thumbnail_url}
            alt={exercise.exercise.title}
            className="w-16 h-16 object-cover rounded"
          />
        )}

        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-foreground">{exercise.exercise?.title}</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Sets</Label>
              <Input
                type="number"
                min="1"
                value={exercise.sets}
                onChange={(e) => onUpdate({ sets: parseInt(e.target.value) })}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Reps Min</Label>
              <Input
                type="number"
                min="1"
                value={exercise.reps_min || ""}
                onChange={(e) => onUpdate({ reps_min: parseInt(e.target.value) || null })}
                className="h-9"
                placeholder="8"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Reps Max</Label>
              <Input
                type="number"
                min="1"
                value={exercise.reps_max || ""}
                onChange={(e) => onUpdate({ reps_max: parseInt(e.target.value) || null })}
                className="h-9"
                placeholder="12"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Rest (sec)</Label>
              <Input
                type="number"
                min="0"
                value={exercise.rest_seconds}
                onChange={(e) => onUpdate({ rest_seconds: parseInt(e.target.value) })}
                className="h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={exercise.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Coach notes for this exercise..."
              className="resize-none h-16"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default function CreateEditWorkout() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isEditing = !!workoutId;

  const { data: workout, isLoading: workoutLoading } = useCoachWorkout(workoutId);
  const createWorkout = useCreateCoachWorkout();
  const updateWorkout = useUpdateCoachWorkout();
  const saveExercises = useSaveWorkoutExercises();
  const { data: allExercises } = useExercises({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<ExerciseInWorkout[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (workout && isEditing) {
      console.log("Populating edit form with workout:", workout);
      setName(workout.name || "");
      setDescription(workout.description || "");

      if (workout.routine_exercises && Array.isArray(workout.routine_exercises)) {
        const exercisesList = workout.routine_exercises
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((re: any) => ({
            routine_id: workout.id,
            exercise_id: re.exercise_id,
            order_index: re.order_index,
            sets: re.sets || 3,
            reps_min: re.reps_min || null,
            reps_max: re.reps_max || null,
            rest_seconds: re.rest_seconds || 90,
            notes: re.notes || null,
            exercise: re.exercises,
          }));

        console.log("Setting exercises:", exercisesList);
        setExercises(exercisesList);
      }
    }
  }, [workout, isEditing]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((i) => i.exercise_id === active.id);
        const newIndex = items.findIndex((i) => i.exercise_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addExercise = (exerciseId: string) => {
    const exercise = allExercises?.find((e) => e.id === exerciseId);
    if (!exercise) return;

    setExercises((prev) => [
      ...prev,
      {
        routine_id: workoutId || "",
        exercise_id: exerciseId,
        order_index: prev.length,
        sets: 3,
        reps_min: 8,
        reps_max: 12,
        rest_seconds: 90,
        notes: null,
        exercise: {
          id: exercise.id,
          title: exercise.title,
          thumbnail_url: exercise.thumbnail_url,
        },
      },
    ]);
    setPickerOpen(false);
    setSearchQuery("");
  };

  const updateExercise = (index: number, updates: Partial<WorkoutExercise>) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    console.log("=== HANDLE SAVE STARTED ===");
    console.log("Workout name:", name);
    console.log("Workout description:", description);
    console.log("Number of exercises:", exercises.length);
    console.log("Exercises to save:", JSON.stringify(exercises, null, 2));
    console.log("Is editing:", isEditing);
    console.log("Workout ID (if editing):", workoutId);

    if (!name.trim()) {
      console.error("Validation failed: Name is empty");
      toast.error("Workout name is required");
      return;
    }

    setIsSaving(true);
    try {
      let finalWorkoutId = workoutId;

      if (isEditing) {
        console.log("Updating existing workout...");
        await updateWorkout.mutateAsync({ id: workoutId!, name, description });
        console.log("Workout updated");
      } else {
        console.log("Creating new workout...");
        const newWorkout = await createWorkout.mutateAsync({ name, description });
        finalWorkoutId = newWorkout.id;
        console.log("New workout created with ID:", finalWorkoutId);
      }

      if (finalWorkoutId) {
        const exercisesToSave = exercises.map((ex, index) => ({
          ...ex,
          routine_id: finalWorkoutId!,
          order_index: index,
        }));

        console.log("Saving exercises for workout:", finalWorkoutId);
        console.log("Exercises payload:", JSON.stringify(exercisesToSave, null, 2));

        await saveExercises.mutateAsync({
          routineId: finalWorkoutId,
          exercises: exercisesToSave,
        });
        console.log("Exercises saved successfully");
      } else {
        console.error("No workout ID available to save exercises");
      }

      console.log("=== SAVE COMPLETED SUCCESSFULLY ===");
      navigate("/workouts");
    } catch (error) {
      console.error("Failed to save workout:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast.error("Failed to save workout. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = allExercises?.filter((ex) =>
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !exercises.find((e) => e.exercise_id === ex.id)
  );

  if (workoutLoading) {
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

          <Button variant="ghost" onClick={() => navigate("/workouts")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>

      <h1 className="text-3xl font-bold text-foreground mb-8">
        {isEditing ? "Edit Workout" : "Create New Workout"}
      </h1>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Workout Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Full Body"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this workout..."
            className="mt-1 resize-none h-24"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label>Exercises ({exercises.length})</Label>
              {exercises.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Drag exercises to reorder them
                </p>
              )}
            </div>
            <Button onClick={() => setPickerOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </div>

          {exercises.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={exercises.map((e) => e.exercise_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <SortableExerciseCard
                      key={exercise.exercise_id}
                      exercise={exercise}
                      index={index}
                      onUpdate={(updates) => updateExercise(index, updates)}
                      onRemove={() => removeExercise(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No exercises added yet</p>
              <Button onClick={() => setPickerOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Exercise
              </Button>
            </Card>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/workouts")} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Workout"
            )}
          </Button>
        </div>
      </div>

      {/* Exercise Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-y-auto max-h-96 space-y-2">
            {filteredExercises && filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addExercise(exercise.id)}
                >
                  {exercise.thumbnail_url && (
                    <img
                      src={exercise.thumbnail_url}
                      alt={exercise.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{exercise.title}</p>
                    <p className="text-sm text-muted-foreground">{exercise.category}</p>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "No exercises found" : "No exercises available"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
}
