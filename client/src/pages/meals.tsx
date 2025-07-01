import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MealForm } from "@/components/meal-form";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Plus, Edit2, Trash2, Calendar, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { format } from "date-fns";
import { Meal } from "@shared/schema";

export default function Meals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mealFormOpen, setMealFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | undefined>();

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const response = await fetch("/api/meals", {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const { data: mealStats } = useQuery({
    queryKey: ["/api/meals/stats"],
    queryFn: async () => {
      const response = await fetch("/api/meals/stats?days=1", {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/stats"] });
      toast({ title: "Meal deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete meal", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setMealFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setMealFormOpen(false);
    setEditingMeal(undefined);
  };

  const getMealIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return Coffee;
      case 'lunch':
        return Sun;
      case 'dinner':
        return Moon;
      case 'snack':
        return Cookie;
      default:
        return Utensils;
    }
  };

  const getMealBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-800';
      case 'lunch':
        return 'bg-yellow-100 text-yellow-800';
      case 'dinner':
        return 'bg-blue-100 text-blue-800';
      case 'snack':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dailyCalorieGoal = 2000;
  const consumed = mealStats?.totalCalories || 0;
  const consumedPercentage = Math.min(100, (consumed / dailyCalorieGoal) * 100);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Meals</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Meals</h2>
        <Button onClick={() => setMealFormOpen(true)} className="bg-secondary hover:bg-emerald-600">
          <Plus className="mr-2" size={16} />
          Log Meal
        </Button>
      </div>

      {/* Daily Calorie Tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Nutrition</CardTitle>
            <span className="text-sm text-gray-500">Goal: {dailyCalorieGoal.toLocaleString()} calories</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Consumed</span>
                <span className="font-medium">{consumed.toLocaleString()} cal</span>
              </div>
              <Progress value={consumedPercentage} className="h-3" />
            </div>
            
            {mealStats?.nutritionBreakdown && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {mealStats.nutritionBreakdown.carbs}%
                  </div>
                  <div className="text-xs text-gray-500">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {mealStats.nutritionBreakdown.protein}%
                  </div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {mealStats.nutritionBreakdown.fat}%
                  </div>
                  <div className="text-xs text-gray-500">Fat</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meal History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Utensils size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meals logged yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your nutrition!</p>
              <Button onClick={() => setMealFormOpen(true)} className="bg-secondary hover:bg-emerald-600">
                <Plus className="mr-2" size={16} />
                Log Your First Meal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal: Meal) => {
                const MealIcon = getMealIcon(meal.type);
                return (
                  <div key={meal.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-100 rounded-full">
                          <MealIcon className="text-accent" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{meal.type}</h4>
                            <Badge className={getMealBadgeColor(meal.type)}>
                              {meal.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {meal.foodItems.length > 50 
                              ? `${meal.foodItems.slice(0, 50)}...` 
                              : meal.foodItems
                            }
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{meal.calories} calories</span>
                            <div className="flex items-center">
                              <Calendar className="mr-1" size={14} />
                              {format(new Date(meal.date), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          {meal.notes && (
                            <p className="text-sm text-gray-600 mt-2">{meal.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(meal)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(meal.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MealForm
        open={mealFormOpen}
        onOpenChange={handleFormClose}
        meal={editingMeal}
      />
    </div>
  );
}
