import {
  users,
  workouts,
  meals,
  insights,
  workoutPlans,
  workoutPlanDays,
  type User,
  type InsertUser,
  type Workout,
  type InsertWorkout,
  type Meal,
  type InsertMeal,
  type Insight,
  type InsertInsight,
  type WorkoutPlan,
  type InsertWorkoutPlan,
  type WorkoutPlanDay,
  type InsertWorkoutPlanDay,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workout methods
  getWorkouts(userId: number, limit?: number): Promise<Workout[]>;
  getWorkout(id: number, userId: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout & { userId: number }): Promise<Workout>;
  updateWorkout(
    id: number,
    userId: number,
    workout: Partial<InsertWorkout>
  ): Promise<Workout | undefined>;
  deleteWorkout(id: number, userId: number): Promise<boolean>;
  getWorkoutStats(
    userId: number,
    days?: number
  ): Promise<{
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
    avgDuration: number;
  }>;

  // Meal methods
  getMeals(userId: number, limit?: number): Promise<Meal[]>;
  getMeal(id: number, userId: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal & { userId: number }): Promise<Meal>;
  updateMeal(
    id: number,
    userId: number,
    meal: Partial<InsertMeal>
  ): Promise<Meal | undefined>;
  deleteMeal(id: number, userId: number): Promise<boolean>;
  getMealStats(
    userId: number,
    days?: number
  ): Promise<{
    totalMeals: number;
    totalCalories: number;
    avgCalories: number;
    nutritionBreakdown: { protein: number; carbs: number; fat: number };
  }>;

  // Insight methods
  getInsights(userId: number, limit?: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight & { userId: number }): Promise<Insight>;
  markInsightAsRead(id: number, userId: number): Promise<boolean>;

  // Workout Plan methods
  getWorkoutPlans(
    userId: number
  ): Promise<(WorkoutPlan & { days: WorkoutPlanDay[] })[]>;
  getActiveWorkoutPlan(
    userId: number
  ): Promise<(WorkoutPlan & { days: WorkoutPlanDay[] }) | undefined>;
  createWorkoutPlan(
    plan: InsertWorkoutPlan & { userId: number },
    days: InsertWorkoutPlanDay[]
  ): Promise<WorkoutPlan & { days: WorkoutPlanDay[] }>;
  updateWorkoutPlan(
    id: number,
    userId: number,
    plan: Partial<InsertWorkoutPlan>
  ): Promise<WorkoutPlan | undefined>;
  deleteWorkoutPlan(id: number, userId: number): Promise<boolean>;
  getNextWorkoutDay(userId: number): Promise<WorkoutPlanDay | undefined>;
  advanceWorkoutPlan(userId: number, planId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Workout methods
  async getWorkouts(userId: number, limit: number = 50): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date))
      .limit(limit);
  }

  async getWorkout(id: number, userId: number): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
    return workout || undefined;
  }

  async createWorkout(
    workout: InsertWorkout & { userId: number }
  ): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(
    id: number,
    userId: number,
    workout: Partial<InsertWorkout>
  ): Promise<Workout | undefined> {
    const [updatedWorkout] = await db
      .update(workouts)
      .set(workout)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning();
    return updatedWorkout || undefined;
  }

  async deleteWorkout(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getWorkoutStats(
    userId: number,
    days: number = 7
  ): Promise<{
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
    avgDuration: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [stats] = await db
      .select({
        totalWorkouts: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${workouts.duration}), 0)::int`,
        totalCalories: sql<number>`coalesce(sum(${workouts.caloriesBurned}), 0)::int`,
        avgDuration: sql<number>`coalesce(avg(${workouts.duration}), 0)::int`,
      })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), gte(workouts.date, since)));

    return stats;
  }

  // Meal methods
  async getMeals(userId: number, limit: number = 50): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.date))
      .limit(limit);
  }

  async getMeal(id: number, userId: number): Promise<Meal | undefined> {
    const [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)));
    return meal || undefined;
  }

  async createMeal(meal: InsertMeal & { userId: number }): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    return newMeal;
  }

  async updateMeal(
    id: number,
    userId: number,
    meal: Partial<InsertMeal>
  ): Promise<Meal | undefined> {
    const [updatedMeal] = await db
      .update(meals)
      .set(meal)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)))
      .returning();
    return updatedMeal || undefined;
  }

  async deleteMeal(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getMealStats(
    userId: number,
    days: number = 1
  ): Promise<{
    totalMeals: number;
    totalCalories: number;
    avgCalories: number;
    nutritionBreakdown: { protein: number; carbs: number; fat: number };
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [stats] = await db
      .select({
        totalMeals: sql<number>`count(*)::int`,
        totalCalories: sql<number>`coalesce(sum(${meals.calories}), 0)::int`,
        avgCalories: sql<number>`coalesce(avg(${meals.calories}), 0)::int`,
        totalProtein: sql<number>`coalesce(sum(${meals.protein}), 0)::float`,
        totalCarbs: sql<number>`coalesce(sum(${meals.carbs}), 0)::float`,
        totalFat: sql<number>`coalesce(sum(${meals.fat}), 0)::float`,
      })
      .from(meals)
      .where(and(eq(meals.userId, userId), gte(meals.date, since)));

    const total = stats.totalProtein + stats.totalCarbs + stats.totalFat;
    const nutritionBreakdown =
      total > 0
        ? {
            protein: Math.round((stats.totalProtein / total) * 100),
            carbs: Math.round((stats.totalCarbs / total) * 100),
            fat: Math.round((stats.totalFat / total) * 100),
          }
        : { protein: 0, carbs: 0, fat: 0 };

    return {
      totalMeals: stats.totalMeals,
      totalCalories: stats.totalCalories,
      avgCalories: stats.avgCalories,
      nutritionBreakdown,
    };
  }

  // Insight methods
  async getInsights(userId: number, limit: number = 20): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(desc(insights.createdAt))
      .limit(limit);
  }

  async createInsight(
    insight: InsertInsight & { userId: number }
  ): Promise<Insight> {
    const [newInsight] = await db.insert(insights).values(insight).returning();
    return newInsight;
  }

  async markInsightAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(insights)
      .set({ isRead: true })
      .where(and(eq(insights.id, id), eq(insights.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Workout Plan methods
  async getWorkoutPlans(
    userId: number
  ): Promise<(WorkoutPlan & { days: WorkoutPlanDay[] })[]> {
    const plans = await db
      .select()
      .from(workoutPlans)
      .where(eq(workoutPlans.userId, userId))
      .orderBy(desc(workoutPlans.createdAt));

    const plansWithDays = await Promise.all(
      plans.map(async (plan) => {
        const days = await db
          .select()
          .from(workoutPlanDays)
          .where(eq(workoutPlanDays.planId, plan.id))
          .orderBy(workoutPlanDays.dayIndex);
        return { ...plan, days };
      })
    );

    return plansWithDays;
  }

  async getActiveWorkoutPlan(
    userId: number
  ): Promise<(WorkoutPlan & { days: WorkoutPlanDay[] }) | undefined> {
    const plan = await db
      .select()
      .from(workoutPlans)
      .where(
        and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true))
      )
      .limit(1);

    if (plan.length === 0) return undefined;

    const days = await db
      .select()
      .from(workoutPlanDays)
      .where(eq(workoutPlanDays.planId, plan[0].id))
      .orderBy(workoutPlanDays.dayIndex);

    return { ...plan[0], days };
  }

  async createWorkoutPlan(
    plan: InsertWorkoutPlan & { userId: number },
    days: InsertWorkoutPlanDay[]
  ): Promise<WorkoutPlan & { days: WorkoutPlanDay[] }> {
    // Deactivate any existing active plans
    await db
      .update(workoutPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(workoutPlans.userId, plan.userId),
          eq(workoutPlans.isActive, true)
        )
      );

    const [newPlan] = await db.insert(workoutPlans).values(plan).returning();

    const daysWithPlanId = days.map((day, index) => ({
      ...day,
      planId: newPlan.id,
      dayIndex: index,
    }));

    const newDays = await db
      .insert(workoutPlanDays)
      .values(daysWithPlanId)
      .returning();

    return { ...newPlan, days: newDays };
  }

  async updateWorkoutPlan(
    id: number,
    userId: number,
    plan: Partial<InsertWorkoutPlan>
  ): Promise<WorkoutPlan | undefined> {
    const [updatedPlan] = await db
      .update(workoutPlans)
      .set(plan)
      .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)))
      .returning();
    return updatedPlan;
  }

  async deleteWorkoutPlan(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(workoutPlans)
      .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getNextWorkoutDay(userId: number): Promise<WorkoutPlanDay | undefined> {
    const activePlan = await this.getActiveWorkoutPlan(userId);
    if (!activePlan) return undefined;

    const currentDayIndex = activePlan.currentDayIndex;
    const nextDay = activePlan.days.find(
      (day) => day.dayIndex === currentDayIndex
    );

    return nextDay;
  }

  async advanceWorkoutPlan(userId: number, planId: number): Promise<void> {
    const plan = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
      .limit(1);

    if (plan.length === 0) return;

    const days = await db
      .select()
      .from(workoutPlanDays)
      .where(eq(workoutPlanDays.planId, planId))
      .orderBy(workoutPlanDays.dayIndex);

    const nextDayIndex = (plan[0].currentDayIndex + 1) % days.length;

    await db
      .update(workoutPlans)
      .set({
        currentDayIndex: nextDayIndex,
        lastWorkoutDate: new Date(),
      })
      .where(eq(workoutPlans.id, planId));
  }
}

export const storage = new DatabaseStorage();
