import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").references(() => workoutPlans.id, {
    onDelete: "set null",
  }), // optional link to workout plan
  planDayId: integer("plan_day_id").references(() => workoutPlanDays.id, {
    onDelete: "set null",
  }), // which day of the plan this was
  type: text("type").notNull(), // cardio, strength, flexibility, sports
  duration: integer("duration").notNull(), // minutes
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  tags: text("tags").array(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // breakfast, lunch, dinner, snack
  foodItems: text("food_items").notNull(),
  calories: integer("calories").notNull(),
  protein: decimal("protein", { precision: 5, scale: 2 }),
  carbs: decimal("carbs", { precision: 5, scale: 2 }),
  fat: decimal("fat", { precision: 5, scale: 2 }),
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // pattern, recommendation, achievement
  title: text("title").notNull(),
  content: text("content").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Push Pull Legs", "Upper Lower", "Full Body"
  description: text("description"),
  daysPerWeek: integer("days_per_week").notNull(),
  currentDayIndex: integer("current_day_index").default(0).notNull(), // tracks which day in the split they're on
  lastWorkoutDate: timestamp("last_workout_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutPlanDays = pgTable("workout_plan_days", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .notNull()
    .references(() => workoutPlans.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(), // 0-based index for the day in the split
  name: text("name").notNull(), // e.g., "Push Day", "Pull Day", "Leg Day"
  description: text("description"),
  muscleGroups: text("muscle_groups").array(), // e.g., ["chest", "triceps", "shoulders"]
  exercises: jsonb("exercises"), // flexible structure for exercises
  restDay: boolean("rest_day").default(false).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  meals: many(meals),
  insights: many(insights),
  workoutPlans: many(workoutPlans),
}));

export const workoutsRelations = relations(workouts, ({ one }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  plan: one(workoutPlans, {
    fields: [workouts.planId],
    references: [workoutPlans.id],
  }),
  planDay: one(workoutPlanDays, {
    fields: [workouts.planDayId],
    references: [workoutPlanDays.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, {
    fields: [insights.userId],
    references: [users.id],
  }),
}));

export const workoutPlansRelations = relations(
  workoutPlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutPlans.userId],
      references: [users.id],
    }),
    days: many(workoutPlanDays),
    workouts: many(workouts),
  })
);

export const workoutPlanDaysRelations = relations(
  workoutPlanDays,
  ({ one, many }) => ({
    plan: one(workoutPlans, {
      fields: [workoutPlanDays.planId],
      references: [workoutPlans.id],
    }),
    workouts: many(workouts),
  })
);

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertWorkoutPlanDaySchema = createInsertSchema(
  workoutPlanDays
).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type WorkoutPlanDay = typeof workoutPlanDays.$inferSelect;
export type InsertWorkoutPlanDay = z.infer<typeof insertWorkoutPlanDaySchema>;
