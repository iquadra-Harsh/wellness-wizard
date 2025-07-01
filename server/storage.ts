import { 
  users, workouts, meals, insights,
  type User, type InsertUser, type Workout, type InsertWorkout,
  type Meal, type InsertMeal, type Insight, type InsertInsight 
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
  updateWorkout(id: number, userId: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number, userId: number): Promise<boolean>;
  getWorkoutStats(userId: number, days?: number): Promise<{
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
    avgDuration: number;
  }>;

  // Meal methods
  getMeals(userId: number, limit?: number): Promise<Meal[]>;
  getMeal(id: number, userId: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal & { userId: number }): Promise<Meal>;
  updateMeal(id: number, userId: number, meal: Partial<InsertMeal>): Promise<Meal | undefined>;
  deleteMeal(id: number, userId: number): Promise<boolean>;
  getMealStats(userId: number, days?: number): Promise<{
    totalMeals: number;
    totalCalories: number;
    avgCalories: number;
    nutritionBreakdown: { protein: number; carbs: number; fat: number };
  }>;

  // Insight methods
  getInsights(userId: number, limit?: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight & { userId: number }): Promise<Insight>;
  markInsightAsRead(id: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
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

  async createWorkout(workout: InsertWorkout & { userId: number }): Promise<Workout> {
    const [newWorkout] = await db
      .insert(workouts)
      .values(workout)
      .returning();
    return newWorkout;
  }

  async updateWorkout(id: number, userId: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
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

  async getWorkoutStats(userId: number, days: number = 7): Promise<{
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
    const [newMeal] = await db
      .insert(meals)
      .values(meal)
      .returning();
    return newMeal;
  }

  async updateMeal(id: number, userId: number, meal: Partial<InsertMeal>): Promise<Meal | undefined> {
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

  async getMealStats(userId: number, days: number = 1): Promise<{
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
    const nutritionBreakdown = total > 0 ? {
      protein: Math.round((stats.totalProtein / total) * 100),
      carbs: Math.round((stats.totalCarbs / total) * 100),
      fat: Math.round((stats.totalFat / total) * 100),
    } : { protein: 0, carbs: 0, fat: 0 };

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

  async createInsight(insight: InsertInsight & { userId: number }): Promise<Insight> {
    const [newInsight] = await db
      .insert(insights)
      .values(insight)
      .returning();
    return newInsight;
  }

  async markInsightAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(insights)
      .set({ isRead: true })
      .where(and(eq(insights.id, id), eq(insights.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
