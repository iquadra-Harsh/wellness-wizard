import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityChart } from "@/components/charts/activity-chart";
import {
  Flame,
  Dumbbell,
  Utensils,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUp,
  Brain,
  Trophy,
  Lightbulb,
  Activity,
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: workoutStats } = useQuery({
    queryKey: ["/api/workouts/stats"],
    queryFn: async () => {
      const response = await fetch("/api/workouts/stats?days=7", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fittracker_token")}`,
        },
      });
      return response.json();
    },
  });

  const { data: mealStats } = useQuery({
    queryKey: ["/api/meals/stats"],
    queryFn: async () => {
      const response = await fetch("/api/meals/stats?days=1", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fittracker_token")}`,
        },
      });
      return response.json();
    },
  });

  const { data: recentWorkouts } = useQuery({
    queryKey: ["/api/workouts"],
    queryFn: async () => {
      const response = await fetch("/api/workouts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fittracker_token")}`,
        },
      });
      return response.json();
    },
  });

  const { data: recentMeals } = useQuery({
    queryKey: ["/api/meals"],
    queryFn: async () => {
      const response = await fetch("/api/meals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fittracker_token")}`,
        },
      });
      return response.json();
    },
  });

  const { data: insights } = useQuery({
    queryKey: ["/api/insights"],
    queryFn: async () => {
      const response = await fetch("/api/insights", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fittracker_token")}`,
        },
      });
      return response.json();
    },
  });

  // Generate last 7 days for activity chart
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = {
    labels: last7Days.map((date) => format(date, "EEE")),
    workouts: last7Days.map((date) => {
      const dayWorkouts =
        recentWorkouts?.filter(
          (workout: any) =>
            format(new Date(workout.date), "yyyy-MM-dd") ===
            format(date, "yyyy-MM-dd")
        ) || [];
      return dayWorkouts.length;
    }),
  };

  const recentActivities = [
    ...(recentWorkouts?.slice(0, 2).map((workout: any) => ({
      id: workout.id,
      type: "workout",
      title: workout.type,
      subtitle: `${workout.duration} min • ${
        workout.caloriesBurned || 0
      } calories`,
      time: format(new Date(workout.date), "h:mm a"),
      icon: Dumbbell,
      bgColor: "bg-blue-100",
      iconColor: "text-primary",
    })) || []),
    ...(recentMeals?.slice(0, 2).map((meal: any) => ({
      id: meal.id,
      type: "meal",
      title: meal.type,
      subtitle: `${meal.foodItems.slice(0, 30)}... • ${meal.calories} cal`,
      time: format(new Date(meal.date), "h:mm a"),
      icon: Utensils,
      bgColor: "bg-amber-100",
      iconColor: "text-accent",
    })) || []),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 3);

  const goalProgress = Math.min(
    100,
    Math.round(((workoutStats?.totalWorkouts || 0) / 4) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name || "User"}!
            </h2>
            <p className="text-blue-100">
              Ready to crush your fitness goals today?
            </p>
          </div>
          <div className="hidden sm:block">
            <Trophy className="text-blue-200" size={64} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Flame className="text-secondary" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Calories Burned
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {workoutStats?.totalCalories || 0}
                </p>
              </div>
            </div>
            {workoutStats?.totalCalories > 0 && (
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="mr-1" size={16} />
                  <span>This week</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Dumbbell className="text-primary" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workoutStats?.totalWorkouts || 0}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="mr-1" size={16} />
                <span>{workoutStats?.totalWorkouts || 0} this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100">
                <Utensils className="text-accent" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Calories
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mealStats?.totalCalories || 0}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="mr-1" size={16} />
                <span>{mealStats?.totalMeals || 0} meals today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="text-purple-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Goal Progress
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {goalProgress}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Activity</CardTitle>
              <Badge variant="outline">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ActivityChart data={chartData} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              {recentActivities.length === 0 && (
                <Badge variant="secondary">No activities yet</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Activity size={48} className="mx-auto" />
                </div>
                <p className="text-gray-500">No recent activities</p>
                <p className="text-sm text-gray-400">
                  Start by logging a workout or meal!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`p-2 ${activity.bgColor} rounded-full`}>
                        <Icon className={activity.iconColor} size={16} />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.subtitle}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <Brain className="text-purple-600" size={20} />
            </div>
            <CardTitle>AI Insights & Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!insights || insights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Lightbulb size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500">No insights available yet</p>
              <p className="text-sm text-gray-400">
                Keep logging activities to get personalized insights!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(0, 2).map((insight: any) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.type === "pattern"
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                      : insight.type === "recommendation"
                      ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                      : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                  }`}
                >
                  <div className="flex items-start">
                    <Lightbulb
                      className={`mt-1 mr-3 ${
                        insight.type === "pattern"
                          ? "text-blue-600"
                          : insight.type === "recommendation"
                          ? "text-green-600"
                          : "text-purple-600"
                      }`}
                      size={20}
                    />
                    <div>
                      <h4
                        className={`font-medium mb-2 ${
                          insight.type === "pattern"
                            ? "text-blue-900"
                            : insight.type === "recommendation"
                            ? "text-green-900"
                            : "text-purple-900"
                        }`}
                      >
                        {insight.title}
                      </h4>
                      <p
                        className={`text-sm ${
                          insight.type === "pattern"
                            ? "text-blue-700"
                            : insight.type === "recommendation"
                            ? "text-green-700"
                            : "text-purple-700"
                        }`}
                      >
                        {insight.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
