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
import { useToast } from "@/hooks/use-toast";
import { Target, Dumbbell, Utensils, Droplet } from "lucide-react";
import { UserGoals } from "@shared/schema";

const goalsFormSchema = z.object({
  weeklyWorkoutGoal: z
    .number()
    .min(1, "Must be at least 1 workout per week")
    .max(14, "Maximum 14 workouts per week"),
  dailyCalorieGoal: z
    .number()
    .min(800, "Minimum 800 calories")
    .max(5000, "Maximum 5000 calories"),
  hydrationGoal: z
    .number()
    .min(1, "Must drink at least 1 glass")
    .max(20, "Maximum 20 glasses"),
  weightGoal: z.number().optional(),
  targetBodyFat: z.number().min(5).max(50).optional(),
});

type GoalsFormData = z.infer<typeof goalsFormSchema>;

interface GoalsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals?: UserGoals;
}

export function GoalsForm({
  open,
  onOpenChange,
  currentGoals,
}: GoalsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GoalsFormData>({
    resolver: zodResolver(goalsFormSchema),
    defaultValues: {
      weeklyWorkoutGoal: currentGoals?.weeklyWorkoutGoal || 4,
      dailyCalorieGoal: currentGoals?.dailyCalorieGoal || 2000,
      hydrationGoal: currentGoals?.hydrationGoal || 8,
      weightGoal: currentGoals?.weightGoal
        ? Number(currentGoals.weightGoal)
        : undefined,
      targetBodyFat: currentGoals?.targetBodyFat
        ? Number(currentGoals.targetBodyFat)
        : undefined,
    },
  });

  const updateGoalsMutation = useMutation({
    mutationFn: async (data: GoalsFormData) => {
      const response = await apiRequest("PUT", "/api/user-goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-goals"] });
      toast({ title: "Goals updated successfully!" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update goals",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: GoalsFormData) => {
    updateGoalsMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="mr-2" size={20} />
            Set Your Fitness Goals
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weeklyWorkoutGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Dumbbell className="mr-2" size={16} />
                      Weekly Workouts
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hydrationGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Droplet className="mr-2" size={16} />
                      Daily Water (glasses)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="8"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dailyCalorieGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Utensils className="mr-2" size={16} />
                    Daily Calorie Target
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">
                Optional Goals
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="150.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
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
                  name="targetBodyFat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Body Fat (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="15.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={updateGoalsMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateGoalsMutation.isPending ? "Saving..." : "Save Goals"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
