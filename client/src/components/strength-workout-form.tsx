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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Plus, X, Edit2, Trash2 } from "lucide-react";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseDatabase } from "@shared/schema";

const strengthWorkoutFormSchema = z.object({
  type: z.string().default("strength"),
  workoutType: z.string().default("strength"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  caloriesBurned: z.number().optional(),
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
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("");

  const form = useForm<StrengthWorkoutFormData>({
    resolver: zodResolver(strengthWorkoutFormSchema),
    defaultValues: {
      type: "strength",
      workoutType: "strength",
      duration: 60,
      caloriesBurned: undefined,
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
        caloriesBurned: workout.caloriesBurned || undefined,
        notes: workout.notes || "",
        date: workout.date
          ? new Date(workout.date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });

      // Load existing exercises if editing
      if (workout.exercises) {
        const loadedExercises = workout.exercises.map((exercise: any) => ({
          name: exercise.name,
          category: exercise.category || "",
          sets: exercise.sets || [],
        }));
        setExercises(loadedExercises);
      }
    } else if (!workout && open) {
      form.reset({
        type: "strength",
        workoutType: "strength",
        duration: 60,
        caloriesBurned: undefined,
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
    if (!newExerciseName.trim()) {
      toast({ title: "Please enter an exercise name", variant: "destructive" });
      return;
    }

    const newExercise: Exercise = {
      name: newExerciseName.trim(),
      category:
        newExerciseCategory.trim() && newExerciseCategory !== "none"
          ? newExerciseCategory.trim()
          : undefined,
      sets: [{ setNumber: 1, reps: 10, weight: 0, isWarmup: false }],
    };

    setExercises([...exercises, newExercise]);
    setNewExerciseName("");
    setNewExerciseCategory("");
  };

  const addExerciseFromDatabase = (exerciseData: ExerciseDatabase) => {
    const newExercise: Exercise = {
      name: exerciseData.name,
      category: exerciseData.primaryMuscles?.[0] || undefined,
      sets: [{ setNumber: 1, reps: 10, weight: 0, isWarmup: false }],
    };

    setExercises([...exercises, newExercise]);
    toast({ title: `Added ${exerciseData.name} to workout` });
  };

  const removeExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
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
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories Burned (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
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

            {/* Exercise Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exercises</h3>

              {/* Add Exercise from Database */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Exercise Library
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Browse over 800 exercises with instructions
                  </p>
                </CardHeader>
                <CardContent>
                  <ExercisePicker
                    onExerciseSelect={addExerciseFromDatabase}
                    trigger={
                      <Button
                        type="button"
                        variant="default"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Browse Exercise Library
                      </Button>
                    }
                  />
                </CardContent>
              </Card>

              {/* Add Custom Exercise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Add Custom Exercise
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add your own exercise not in the library
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Exercise Name
                      </label>
                      <Input
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="e.g., Bench Press, Squat"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Category (optional)
                      </label>
                      <Select
                        value={newExerciseCategory}
                        onValueChange={setNewExerciseCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          <SelectItem value="chest">Chest</SelectItem>
                          <SelectItem value="back">Back</SelectItem>
                          <SelectItem value="shoulders">Shoulders</SelectItem>
                          <SelectItem value="arms">Arms</SelectItem>
                          <SelectItem value="legs">Legs</SelectItem>
                          <SelectItem value="core">Core</SelectItem>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addExercise}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </CardContent>
              </Card>

              {/* Exercise List */}
              {exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
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
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sets */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Sets</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Set
                        </Button>
                      </div>

                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex items-center space-x-2"
                        >
                          <span className="text-sm font-medium w-8">
                            #{set.setNumber}
                          </span>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Reps
                              </label>
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
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Weight (lbs)
                              </label>
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
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600">
                              Warmup
                            </label>
                            <input
                              type="checkbox"
                              checked={set.isWarmup || false}
                              onChange={(e) =>
                                updateSet(
                                  exerciseIndex,
                                  setIndex,
                                  "isWarmup",
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? workout
                    ? "Updating..."
                    : "Logging..."
                  : workout
                  ? "Update Workout"
                  : "Log Workout"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
