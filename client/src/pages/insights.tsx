import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressChart } from "@/components/charts/progress-chart";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  RefreshCw, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  Clock, 
  Droplet,
  Trophy,
  AlertCircle
} from "lucide-react";
import { format, subWeeks, eachWeekOfInterval } from "date-fns";

export default function Insights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights"],
    queryFn: async () => {
      const response = await fetch("/api/insights", {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const { data: workouts = [] } = useQuery({
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
      const response = await fetch(`/api/workouts/stats?days=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const { data: mealStats } = useQuery({
    queryKey: ["/api/meals/stats"],
    queryFn: async () => {
      const response = await fetch(`/api/meals/stats?days=7`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('fittracker_token')}` },
      });
      return response.json();
    },
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/insights/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({ title: "New insights generated!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate insights", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Generate progress chart data
  const last4Weeks = eachWeekOfInterval({
    start: subWeeks(new Date(), 3),
    end: new Date(),
  });

  const progressData = {
    labels: last4Weeks.map(date => format(date, 'MMM d')),
    workoutFrequency: last4Weeks.map(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekWorkouts = workouts.filter((workout: any) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });
      
      return weekWorkouts.length;
    }),
    avgCalories: last4Weeks.map(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekWorkouts = workouts.filter((workout: any) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });
      
      const totalCalories = weekWorkouts.reduce((sum: number, workout: any) => 
        sum + (workout.caloriesBurned || 0), 0);
      
      return weekWorkouts.length > 0 ? Math.round(totalCalories / 7) : 0;
    }),
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return TrendingUp;
      case 'recommendation':
        return Lightbulb;
      case 'achievement':
        return Trophy;
      default:
        return Brain;
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'pattern':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          content: 'text-blue-700'
        };
      case 'recommendation':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          content: 'text-green-700'
        };
      case 'achievement':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          title: 'text-purple-900',
          content: 'text-purple-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          content: 'text-gray-700'
        };
    }
  };

  // Calculate goal achievements
  const weeklyWorkoutGoal = 4;
  const dailyCalorieGoal = 2000;
  const weeklyCalorieGoal = dailyCalorieGoal * 7;
  const hydrationGoal = 8; // glasses per day

  const workoutGoalProgress = Math.min(100, ((workoutStats?.totalWorkouts || 0) / weeklyWorkoutGoal) * 100);
  const calorieGoalProgress = Math.min(100, ((mealStats?.totalCalories || 0) / dailyCalorieGoal) * 100);
  const hydrationProgress = 75; // Mock data for hydration

  if (insightsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
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
        <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
        <Button 
          onClick={() => generateInsightsMutation.mutate()}
          disabled={generateInsightsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`mr-2 ${generateInsightsMutation.isPending ? 'animate-spin' : ''}`} size={16} />
          {generateInsightsMutation.isPending ? 'Generating...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Patterns */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <TrendingUp className="text-primary" size={20} />
              </div>
              <CardTitle>Behavioral Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {insights.filter((insight: any) => insight.type === 'pattern').length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-500">No behavioral patterns detected yet</p>
                <p className="text-sm text-gray-400">Keep logging activities to discover patterns!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights
                  .filter((insight: any) => insight.type === 'pattern')
                  .slice(0, 2)
                  .map((insight: any) => {
                    const colors = getInsightColors(insight.type);
                    const Icon = getInsightIcon(insight.type);
                    return (
                      <div key={insight.id} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <div className="flex items-start">
                          <Icon className={`mt-1 mr-3 ${colors.icon}`} size={20} />
                          <div>
                            <h4 className={`font-medium mb-2 ${colors.title}`}>
                              {insight.title}
                            </h4>
                            <p className={`text-sm ${colors.content}`}>
                              {insight.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <Lightbulb className="text-secondary" size={20} />
              </div>
              <CardTitle>Personalized Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {insights.filter((insight: any) => insight.type === 'recommendation').length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-500">No recommendations available yet</p>
                <p className="text-sm text-gray-400">Generate insights to get personalized tips!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights
                  .filter((insight: any) => insight.type === 'recommendation')
                  .slice(0, 2)
                  .map((insight: any) => {
                    const colors = getInsightColors(insight.type);
                    const Icon = getInsightIcon(insight.type);
                    return (
                      <div key={insight.id} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <div className="flex items-start">
                          <Icon className={`mt-1 mr-3 ${colors.icon}`} size={20} />
                          <div>
                            <h4 className={`font-medium mb-2 ${colors.title}`}>
                              {insight.title}
                            </h4>
                            <p className={`text-sm ${colors.content}`}>
                              {insight.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress Trends</CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ProgressChart data={progressData} />
          </div>
        </CardContent>
      </Card>

      {/* Goal Achievement */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Achievement Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              workoutGoalProgress >= 100 
                ? 'bg-green-50 border-green-200' 
                : workoutGoalProgress >= 75 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <div className={`mr-3 ${
                  workoutGoalProgress >= 100 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {workoutGoalProgress >= 100 ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <h4 className={`font-medium ${
                    workoutGoalProgress >= 100 
                      ? 'text-green-900' 
                      : workoutGoalProgress >= 75 
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}>
                    Weekly Workout Goal
                  </h4>
                  <p className={`text-sm ${
                    workoutGoalProgress >= 100 
                      ? 'text-green-700' 
                      : workoutGoalProgress >= 75 
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {workoutStats?.totalWorkouts || 0} of {weeklyWorkoutGoal} workouts completed
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                workoutGoalProgress >= 100 
                  ? 'text-green-600' 
                  : workoutGoalProgress >= 75 
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {Math.round(workoutGoalProgress)}%
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              calorieGoalProgress >= 80 
                ? 'bg-green-50 border-green-200' 
                : calorieGoalProgress >= 60 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <div className={`mr-3 ${
                  calorieGoalProgress >= 80 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {calorieGoalProgress >= 80 ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <h4 className={`font-medium ${
                    calorieGoalProgress >= 80 
                      ? 'text-green-900' 
                      : calorieGoalProgress >= 60 
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}>
                    Daily Calorie Target
                  </h4>
                  <p className={`text-sm ${
                    calorieGoalProgress >= 80 
                      ? 'text-green-700' 
                      : calorieGoalProgress >= 60 
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {mealStats?.totalCalories || 0} of {dailyCalorieGoal} calories
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                calorieGoalProgress >= 80 
                  ? 'text-green-600' 
                  : calorieGoalProgress >= 60 
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {Math.round(calorieGoalProgress)}%
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Droplet className="text-blue-600 mr-3" size={20} />
                <div>
                  <h4 className="font-medium text-blue-900">Hydration Goal</h4>
                  <p className="text-sm text-blue-700">
                    {Math.round(hydrationProgress / 100 * hydrationGoal)} of {hydrationGoal} glasses consumed
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{hydrationProgress}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
