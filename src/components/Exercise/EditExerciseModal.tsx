import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateExercise } from "@/hooks/useUpdateExercise";
import { Exercise, ExerciseCategory } from "@/hooks/useExercises";
import { Loader2 } from "lucide-react";
import { MultiSelectAutocomplete, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from "@/components/ui/multi-select-autocomplete";

const categories: ExerciseCategory[] = [
  "bodybuilding",
  "crossfit",
  "powerlifting",
  "weightlifting",
  "functional",
  "plyometrics",
];

const editExerciseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  description: z
    .string()
    .trim()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional()
    .nullable(),
  category: z.enum([
    "bodybuilding",
    "crossfit",
    "powerlifting",
    "weightlifting",
    "functional",
    "plyometrics",
  ]),
  primary_muscles: z
    .string()
    .trim()
    .max(200, { message: "Primary muscles must be less than 200 characters" })
    .optional()
    .nullable(),
  equipment: z
    .string()
    .trim()
    .max(200, { message: "Equipment must be less than 200 characters" })
    .optional()
    .nullable(),
  suggested_sets: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .nullable(),
  suggested_reps: z
    .string()
    .trim()
    .max(50, { message: "Suggested reps must be less than 50 characters" })
    .optional()
    .nullable(),
  suggested_weight: z
    .string()
    .trim()
    .max(50, { message: "Suggested weight must be less than 50 characters" })
    .optional()
    .nullable(),
  key_aspects: z
    .string()
    .trim()
    .max(2000, { message: "Key aspects must be less than 2000 characters" })
    .optional()
    .nullable(),
  common_mistakes: z
    .string()
    .trim()
    .max(2000, { message: "Common mistakes must be less than 2000 characters" })
    .optional()
    .nullable(),
});

type EditExerciseFormData = z.infer<typeof editExerciseSchema>;

interface EditExerciseModalProps {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditExerciseModal = ({
  exercise,
  open,
  onOpenChange,
  onSuccess,
}: EditExerciseModalProps) => {
  const { updateExercise, isUpdating } = useUpdateExercise();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>(
    exercise.category
  );
  const [primaryMuscles, setPrimaryMuscles] = useState(exercise.primary_muscles || "");
  const [equipmentValue, setEquipmentValue] = useState(exercise.equipment || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditExerciseFormData>({
    resolver: zodResolver(editExerciseSchema),
    defaultValues: {
      title: exercise.title,
      description: exercise.description || "",
      category: exercise.category,
      primary_muscles: exercise.primary_muscles || "",
      equipment: exercise.equipment || "",
      suggested_sets: exercise.suggested_sets || undefined,
      suggested_reps: exercise.suggested_reps || "",
      suggested_weight: exercise.suggested_weight || "",
      key_aspects: exercise.key_aspects || "",
      common_mistakes: exercise.common_mistakes || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: exercise.title,
        description: exercise.description || "",
        category: exercise.category,
        primary_muscles: exercise.primary_muscles || "",
        equipment: exercise.equipment || "",
        suggested_sets: exercise.suggested_sets || undefined,
        suggested_reps: exercise.suggested_reps || "",
        suggested_weight: exercise.suggested_weight || "",
        key_aspects: exercise.key_aspects || "",
        common_mistakes: exercise.common_mistakes || "",
      });
      setSelectedCategory(exercise.category);
      setPrimaryMuscles(exercise.primary_muscles || "");
      setEquipmentValue(exercise.equipment || "");
    }
  }, [open, exercise, reset]);

  const onSubmit = async (data: EditExerciseFormData) => {
    try {
      await updateExercise({
        exerciseId: exercise.id,
        updates: {
          ...data,
          primary_muscles: primaryMuscles || null,
          equipment: equipmentValue || null,
          suggested_sets: data.suggested_sets || null,
        },
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
          <DialogDescription>
            Update the exercise details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter exercise title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter exercise description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value as ExerciseCategory);
                setValue("category", value as ExerciseCategory);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Primary Muscles */}
          <div className="space-y-2">
            <Label htmlFor="primary_muscles">Primary Muscles</Label>
            <MultiSelectAutocomplete
              options={MUSCLE_GROUPS}
              value={primaryMuscles}
              onChange={setPrimaryMuscles}
              placeholder="Select muscle groups..."
              emptyMessage="No muscle groups found."
              disabled={isUpdating}
            />
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment</Label>
            <MultiSelectAutocomplete
              options={EQUIPMENT_OPTIONS}
              value={equipmentValue}
              onChange={setEquipmentValue}
              placeholder="Select equipment..."
              emptyMessage="No equipment found."
              disabled={isUpdating}
            />
          </div>

          {/* Suggested Program */}
          <div className="space-y-4">
            <Label>Suggested Program</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suggested_sets" className="text-sm">
                  Sets
                </Label>
                <Input
                  id="suggested_sets"
                  type="number"
                  {...register("suggested_sets", { valueAsNumber: true })}
                  placeholder="e.g., 4"
                  min="1"
                  max="20"
                />
                {errors.suggested_sets && (
                  <p className="text-xs text-destructive">
                    {errors.suggested_sets.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested_reps" className="text-sm">
                  Reps
                </Label>
                <Input
                  id="suggested_reps"
                  {...register("suggested_reps")}
                  placeholder="e.g., 8-10"
                />
                {errors.suggested_reps && (
                  <p className="text-xs text-destructive">
                    {errors.suggested_reps.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggested_weight" className="text-sm">
                  Weight
                </Label>
                <Input
                  id="suggested_weight"
                  {...register("suggested_weight")}
                  placeholder="e.g., 70% 1RM"
                />
                {errors.suggested_weight && (
                  <p className="text-xs text-destructive">
                    {errors.suggested_weight.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key Aspects */}
          <div className="space-y-2">
            <Label htmlFor="key_aspects">Key Aspects</Label>
            <Textarea
              id="key_aspects"
              {...register("key_aspects")}
              placeholder="Enter key aspects (one per line)"
              rows={4}
            />
            {errors.key_aspects && (
              <p className="text-sm text-destructive">
                {errors.key_aspects.message}
              </p>
            )}
          </div>

          {/* Common Mistakes */}
          <div className="space-y-2">
            <Label htmlFor="common_mistakes">Common Mistakes</Label>
            <Textarea
              id="common_mistakes"
              {...register("common_mistakes")}
              placeholder="Enter common mistakes (one per line)"
              rows={4}
            />
            {errors.common_mistakes && (
              <p className="text-sm text-destructive">
                {errors.common_mistakes.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
