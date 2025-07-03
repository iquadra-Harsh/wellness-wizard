import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutPlanForm } from "@/components/workout-plan-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Calendar, Target, Play, Trash2 } from "lucide-react";
import { WorkoutPlan, WorkoutPlanDay } from "@shared/schema";

export default function WorkoutPlans() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery<
    (WorkoutPlan & { days: WorkoutPlanDay[] })[]
  >({
    queryKey: ["/api/workout-plans"],
  });

  const { data: activePlan } = useQuery<
    WorkoutPlan & { days: WorkoutPlanDay[] }
  >({
    queryKey: ["/api/workout-plans/active"],
  });

  const { data: nextDay } = useQuery<WorkoutPlanDay>({
    queryKey: ["/api/workout-plans/next-day"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/workout-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-plans"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/workout-plans/active"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workout plan",
        variant: "destructive",
      });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest("POST", `/api/workout-plans/${planId}/advance`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout plan advanced to next day",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-plans"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/workout-plans/active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/workout-plans/next-day"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance workout plan",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this workout plan?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdvance = (planId: number) => {
    advanceMutation.mutate(planId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Workout Plans</h1>
            <p className="text-muted-foreground">
              Create and manage your workout plans
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workout Plans</h1>
          <p className="text-muted-foreground">
            Create and manage your workout plans
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Next Workout */}
      {activePlan && nextDay && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Next Workout
            </CardTitle>
            <CardDescription>
              Your next scheduled workout from {activePlan.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{nextDay.name}</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {nextDay.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {nextDay.muscleGroups?.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAdvance(activePlan.id)}
                  disabled={advanceMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Complete & Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Plans */}
      <div className="grid gap-6">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workout Plans</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first workout plan to get started with structured
                training
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className={plan.isActive ? "border-primary" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {plan.name}
                      {plan.isActive && (
                        <Badge variant="default" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {plan.daysPerWeek} days/week
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Workout Days:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plan.days.map((day, index: number) => (
                        <div
                          key={day.id}
                          className={`p-3 border rounded-lg ${
                            plan.isActive && plan.currentDayIndex === index
                              ? "border-primary bg-primary/5"
                              : "border-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-sm">{day.name}</h5>
                            {plan.isActive &&
                              plan.currentDayIndex === index && (
                                <Badge variant="outline" className="text-xs">
                                  Next
                                </Badge>
                              )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {day.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {day.muscleGroups?.map((group) => (
                              <Badge
                                key={group}
                                variant="secondary"
                                className="text-xs"
                              >
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.lastWorkoutDate && (
                    <div className="text-sm text-muted-foreground">
                      Last workout:{" "}
                      {new Date(plan.lastWorkoutDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <WorkoutPlanForm open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  );
}
