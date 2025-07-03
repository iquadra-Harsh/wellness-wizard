import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

const workoutPlanFormSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  daysPerWeek: z.number().min(1).max(7),
});

type WorkoutPlanFormData = z.infer<typeof workoutPlanFormSchema>;

interface WorkoutPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREDEFINED_SPLITS = {
  "Push Pull Legs": {
    daysPerWeek: 6,
    description:
      "Push (chest, triceps, shoulders), Pull (back, biceps), Legs, repeat",
    days: [
      {
        name: "Push Day",
        muscleGroups: ["chest", "triceps", "shoulders"],
        description: "Chest, triceps, and shoulders workout",
      },
      {
        name: "Pull Day",
        muscleGroups: ["back", "biceps"],
        description: "Back and biceps workout",
      },
      {
        name: "Leg Day",
        muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
        description: "Legs and glutes workout",
      },
      {
        name: "Push Day",
        muscleGroups: ["chest", "triceps", "shoulders"],
        description: "Chest, triceps, and shoulders workout",
      },
      {
        name: "Pull Day",
        muscleGroups: ["back", "biceps"],
        description: "Back and biceps workout",
      },
      {
        name: "Leg Day",
        muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
        description: "Legs and glutes workout",
      },
    ],
  },
  "Upper Lower": {
    daysPerWeek: 4,
    description: "Upper body and lower body alternating",
    days: [
      {
        name: "Upper Body",
        muscleGroups: ["chest", "back", "shoulders", "arms"],
        description: "Upper body workout",
      },
      {
        name: "Lower Body",
        muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
        description: "Lower body workout",
      },
      {
        name: "Upper Body",
        muscleGroups: ["chest", "back", "shoulders", "arms"],
        description: "Upper body workout",
      },
      {
        name: "Lower Body",
        muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
        description: "Lower body workout",
      },
    ],
  },
  "Full Body": {
    daysPerWeek: 3,
    description: "Full body workouts with rest days between",
    days: [
      {
        name: "Full Body A",
        muscleGroups: ["chest", "back", "quads", "hamstrings", "shoulders"],
        description: "Full body workout A",
      },
      {
        name: "Full Body B",
        muscleGroups: ["chest", "back", "glutes", "calves", "arms"],
        description: "Full body workout B",
      },
      {
        name: "Full Body C",
        muscleGroups: ["back", "quads", "hamstrings", "shoulders", "arms"],
        description: "Full body workout C",
      },
    ],
  },
  "Bro Split": {
    daysPerWeek: 5,
    description: "Each muscle group gets its own day",
    days: [
      {
        name: "Chest Day",
        muscleGroups: ["chest"],
        description: "Chest focused workout",
      },
      {
        name: "Back Day",
        muscleGroups: ["back"],
        description: "Back focused workout",
      },
      {
        name: "Shoulder Day",
        muscleGroups: ["shoulders"],
        description: "Shoulder focused workout",
      },
      {
        name: "Arm Day",
        muscleGroups: ["arms"],
        description: "Arms focused workout",
      },
      {
        name: "Leg Day",
        muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
        description: "Legs focused workout",
      },
    ],
  },
};

export function WorkoutPlanForm({ open, onOpenChange }: WorkoutPlanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSplit, setSelectedSplit] = useState<string>("");
  const [customDays, setCustomDays] = useState<
    Array<{ name: string; muscleGroups: string[]; description: string }>
  >([]);

  const form = useForm<WorkoutPlanFormData>({
    resolver: zodResolver(workoutPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      daysPerWeek: 3,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { plan: WorkoutPlanFormData; days: any[] }) => {
      return await apiRequest("POST", "/api/workout-plans", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout plan created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-plans"] });
      onOpenChange(false);
      form.reset();
      setSelectedSplit("");
      setCustomDays([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workout plan",
        variant: "destructive",
      });
    },
  });

  const handleSplitSelect = (splitName: string) => {
    setSelectedSplit(splitName);
    const split =
      PREDEFINED_SPLITS[splitName as keyof typeof PREDEFINED_SPLITS];
    if (split) {
      form.setValue("name", splitName);
      form.setValue("description", split.description);
      form.setValue("daysPerWeek", split.daysPerWeek);
      setCustomDays(split.days);
    }
  };

  const addCustomDay = () => {
    setCustomDays([
      ...customDays,
      { name: "", muscleGroups: [], description: "" },
    ]);
  };

  const updateCustomDay = (index: number, field: string, value: any) => {
    const updated = [...customDays];
    updated[index] = { ...updated[index], [field]: value };
    setCustomDays(updated);
  };

  const removeCustomDay = (index: number) => {
    setCustomDays(customDays.filter((_, i) => i !== index));
  };

  const addMuscleGroup = (dayIndex: number, muscleGroup: string) => {
    const updated = [...customDays];
    if (!updated[dayIndex].muscleGroups.includes(muscleGroup)) {
      updated[dayIndex].muscleGroups.push(muscleGroup);
      setCustomDays(updated);
    }
  };

  const removeMuscleGroup = (dayIndex: number, muscleGroup: string) => {
    const updated = [...customDays];
    updated[dayIndex].muscleGroups = updated[dayIndex].muscleGroups.filter(
      (mg) => mg !== muscleGroup
    );
    setCustomDays(updated);
  };

  const onSubmit = async (data: WorkoutPlanFormData) => {
    if (customDays.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one workout day",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ plan: data, days: customDays });
  };

  const muscleGroupOptions = [
    "chest",
    "back",
    "shoulders",
    "arms",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
    "cardio",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workout Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Predefined Splits */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Choose a Predefined Split
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(PREDEFINED_SPLITS).map(([name, split]) => (
                <Card
                  key={name}
                  className={`cursor-pointer transition-colors ${
                    selectedSplit === name ? "border-primary" : ""
                  }`}
                  onClick={() => handleSplitSelect(name)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {split.description}
                    </p>
                    <p className="text-xs">
                      <strong>{split.daysPerWeek} days per week</strong>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Workout Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daysPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days Per Week</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="7"
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your workout plan..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Days */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Workout Days</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomDay}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Day
                  </Button>
                </div>

                <div className="space-y-4">
                  {customDays.map((day, dayIndex) => (
                    <Card key={dayIndex}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">
                                Day Name
                              </label>
                              <Input
                                placeholder="e.g., Push Day"
                                value={day.name}
                                onChange={(e) =>
                                  updateCustomDay(
                                    dayIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Description
                              </label>
                              <Input
                                placeholder="e.g., Chest, triceps, shoulders"
                                value={day.description}
                                onChange={(e) =>
                                  updateCustomDay(
                                    dayIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomDay(dayIndex)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Muscle Groups
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {day.muscleGroups.map((mg) => (
                              <Badge
                                key={mg}
                                variant="secondary"
                                className="text-xs"
                              >
                                {mg}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMuscleGroup(dayIndex, mg)
                                  }
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <Select
                            onValueChange={(value) =>
                              addMuscleGroup(dayIndex, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Add muscle group" />
                            </SelectTrigger>
                            <SelectContent>
                              {muscleGroupOptions.map((mg) => (
                                <SelectItem key={mg} value={mg}>
                                  {mg}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
