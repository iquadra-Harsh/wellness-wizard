import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutForm } from "@/components/workout-form";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Plus, Edit2, Trash2, Calendar, Clock, Flame } from "lucide-react";
import { format } from "date-fns";
import { Workout } from "@shared/schema";

export default function Workouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workoutFormOpen, setWorkoutFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["/api/workouts"],
    queryFn: async () => {
      const response = await fetch("/api/workouts", {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const { data: workoutStats } = useQuery({
    queryKey: ["/api/workouts/stats"],
    queryFn: async () => {
      const response = await fetch("/api/workouts/stats?days=7", {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/stats"] });
      toast({ title: "Workout deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete workout", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this workout?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setWorkoutFormOpen(false);
    setEditingWorkout(undefined);
  };

  const getWorkoutIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cardio':
      case 'running':
      case 'cycling':
        return '🏃‍♂️';
      case 'strength training':
      case 'weightlifting':
        return '🏋️‍♂️';
      case 'yoga':
      case 'flexibility':
        return '🧘‍♀️';
      case 'swimming':
        return '🏊‍♂️';
      case 'sports':
        return '⚽';
      default:
        return '💪';
    }
  };

  const getWorkoutBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cardio':
      case 'running':
      case 'cycling':
        return 'bg-red-100 text-red-800';
      case 'strength training':
      case 'weightlifting':
        return 'bg-blue-100 text-blue-800';
      case 'yoga':
      case 'flexibility':
        return 'bg-green-100 text-green-800';
      case 'swimming':
        return 'bg-cyan-100 text-cyan-800';
      case 'sports':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Workouts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Workouts</h2>
        <Button onClick={() => setWorkoutFormOpen(true)} className="bg-primary hover:bg-blue-600">
          <Plus className="mr-2" size={16} />
          Log Workout
        </Button>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {workoutStats?.totalWorkouts || 0}
              </div>
              <p className="text-gray-600">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {workoutStats?.totalMinutes || 0}
              </div>
              <p className="text-gray-600">Minutes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {workoutStats?.avgDuration || 0}
              </div>
              <p className="text-gray-600">Avg Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Dumbbell size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your fitness journey!</p>
              <Button onClick={() => setWorkoutFormOpen(true)} className="bg-primary hover:bg-blue-600">
                <Plus className="mr-2" size={16} />
                Log Your First Workout
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout: Workout) => (
                <div key={workout.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getWorkoutIcon(workout.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{workout.type}</h4>
                          <Badge className={getWorkoutBadgeColor(workout.type)}>
                            {workout.type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="mr-1" size={14} />
                            {workout.duration} minutes
                          </div>
                          {workout.caloriesBurned && (
                            <div className="flex items-center">
                              <Flame className="mr-1" size={14} />
                              {workout.caloriesBurned} calories
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            {format(new Date(workout.date), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        {workout.notes && (
                          <p className="text-sm text-gray-600 mt-2">{workout.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(workout)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(workout.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkoutForm
        open={workoutFormOpen}
        onOpenChange={handleFormClose}
        workout={editingWorkout}
      />
    </div>
  );
}
