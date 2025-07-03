import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Dumbbell } from "lucide-react";

const strengthWorkoutFormSchema = z.object({
  type: z.string().default("strength"),
  workoutType: z.string().default("strength"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().optional(),
  date: z.string().optional(),
});

type StrengthWorkoutFormData = z.infer<typeof strengthWorkoutFormSchema>;

interface Exercise {
  name: string;
  category?: string;
  sets: {
    setNumber: number;
    reps: number;
    weight?: number;
    isWarmup?: boolean;
  }[];
}

interface StrengthWorkoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: any; // Workout with exercises to edit
}

export function StrengthWorkoutForm({
  open,
  onOpenChange,
  workout,
}: StrengthWorkoutFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: "",
    category: "",
  });

  const form = useForm<StrengthWorkoutFormData>({
    resolver: zodResolver(strengthWorkoutFormSchema),
    defaultValues: {
      type: "strength",
      workoutType: "strength",
      duration: 60,
      notes: "",
      date: new Date().toISOString().slice(0, 16),
    },
  });

  // Initialize form with workout data when editing
  useEffect(() => {
    if (workout && open) {
      form.reset({
        type: workout.type || "strength",
        workoutType: workout.workoutType || "strength",
        duration: workout.duration || 60,
        notes: workout.notes || "",
        date: workout.date
          ? new Date(workout.date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });

      // Set exercises from workout
      if (workout.exercises) {
        const formattedExercises = workout.exercises.map((exercise: any) => ({
          name: exercise.name,
          category: exercise.category || "",
          sets: exercise.sets.map((set: any) => ({
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            isWarmup: set.isWarmup || false,
          })),
        }));
        setExercises(formattedExercises);
      }
    } else if (!workout && open) {
      // Reset form when creating new workout
      form.reset({
        type: "strength",
        workoutType: "strength",
        duration: 60,
        notes: "",
        date: new Date().toISOString().slice(0, 16),
      });
      setExercises([]);
    }
  }, [workout, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      workout: StrengthWorkoutFormData;
      exercises: Exercise[];
    }) => {
      const response = await apiRequest("POST", "/api/workouts", {
        workout: {
          ...data.workout,
          date: data.workout.date ? new Date(data.workout.date) : new Date(),
        },
        exercises: data.exercises,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/stats"] });
      toast({ title: "Strength workout logged successfully!" });
      onOpenChange(false);
      form.reset();
      setExercises([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log strength workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      workout: StrengthWorkoutFormData;
      exercises: Exercise[];
    }) => {
      const response = await apiRequest("PUT", `/api/workouts/${workout.id}`, {
        workout: {
          ...data.workout,
          date: data.workout.date ? new Date(data.workout.date) : new Date(),
        },
        exercises: data.exercises,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/stats"] });
      toast({ title: "Strength workout updated successfully!" });
      onOpenChange(false);
      form.reset();
      setExercises([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update strength workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addExercise = () => {
    if (!currentExercise.name.trim()) {
      toast({ title: "Exercise name is required", variant: "destructive" });
      return;
    }

    const newExercise: Exercise = {
      name: currentExercise.name.trim(),
      category: currentExercise.category.trim() || undefined,
      sets: [{ setNumber: 1, reps: 10, weight: 0, isWarmup: false }],
    };

    setExercises([...exercises, newExercise]);
    setCurrentExercise({ name: "", category: "" });
  };

  const removeExercise = (exerciseIndex: number) => {
    setExercises(exercises.filter((_, index) => index !== exerciseIndex));
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;
    const lastSet = exercise.sets[exercise.sets.length - 1];

    exercise.sets.push({
      setNumber: newSetNumber,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      isWarmup: false,
    });

    setExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);

    // Renumber remaining sets
    updatedExercises[exerciseIndex].sets.forEach((set, index) => {
      set.setNumber = index + 1;
    });

    setExercises(updatedExercises);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof Exercise["sets"][0],
    value: any
  ) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setExercises(updatedExercises);
  };

  const onSubmit = async (data: StrengthWorkoutFormData) => {
    if (exercises.length === 0) {
      toast({
        title: "Please add at least one exercise",
        variant: "destructive",
      });
      return;
    }

    if (workout) {
      updateMutation.mutate({ workout: data, exercises });
    } else {
      createMutation.mutate({ workout: data, exercises });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Dumbbell className="w-5 h-5 mr-2" />
            {workout
              ? "Edit Strength Training Workout"
              : "Log Strength Training Workout"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Workout Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Add Exercise Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Exercise name (e.g., Bench Press)"
                    value={currentExercise.name}
                    onChange={(e) =>
                      setCurrentExercise({
                        ...currentExercise,
                        name: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Category (e.g., chest, legs)"
                    value={currentExercise.category}
                    onChange={(e) =>
                      setCurrentExercise({
                        ...currentExercise,
                        category: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    onClick={addExercise}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercises List */}
            {exercises.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Exercises ({exercises.length})
                </h3>
                {exercises.map((exercise, exerciseIndex) => (
                  <Card key={exerciseIndex}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {exercise.name}
                          </CardTitle>
                          {exercise.category && (
                            <Badge variant="secondary" className="mt-1">
                              {exercise.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeExercise(exerciseIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
                          <div>Set</div>
                          <div>Reps</div>
                          <div>Weight (lbs)</div>
                          <div>Actions</div>
                        </div>

                        {exercise.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="grid grid-cols-4 gap-2 items-center"
                          >
                            <div className="text-sm font-medium">
                              {set.isWarmup ? "W" : set.setNumber}
                            </div>
                            <Input
                              type="number"
                              min="1"
                              value={set.reps}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "reps",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-8"
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weight || 0}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "weight",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8"
                            />
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateSet(
                                    exerciseIndex,
                                    setIndex,
                                    "isWarmup",
                                    !set.isWarmup
                                  )
                                }
                                className={`h-8 text-xs ${
                                  set.isWarmup ? "bg-yellow-100" : ""
                                }`}
                              >
                                {set.isWarmup ? "W" : "W?"}
                              </Button>
                              {exercise.sets.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeSet(exerciseIndex, setIndex)
                                  }
                                  className="h-8"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Set
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How did the workout feel? Any observations?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {workout
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update Workout"
                  : createMutation.isPending
                  ? "Logging..."
                  : "Log Workout"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
