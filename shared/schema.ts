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
  type: text("type").notNull(), // strength, cardio, running, cycling, swimming, sports, etc.
  workoutType: text("workout_type").notNull().default("cardio"), // 'strength' or 'cardio'
  duration: integer("duration").notNull(), // minutes
  distance: decimal("distance", { precision: 8, scale: 2 }), // for cardio activities (miles/km)
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  tags: text("tags").array(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Bench Press", "Squat", "Deadlift"
  category: text("category"), // e.g., "chest", "legs", "back"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(), // 1, 2, 3, etc.
  reps: integer("reps").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }), // in lbs or kg
  isWarmup: boolean("is_warmup").default(false),
  restTime: integer("rest_time"), // seconds between sets
  rpe: integer("rpe"), // Rate of Perceived Exertion (1-10)
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

export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weeklyWorkoutGoal: integer("weekly_workout_goal").default(4).notNull(), // workouts per week
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000).notNull(), // calories per day
  hydrationGoal: integer("hydration_goal").default(8).notNull(), // glasses per day
  weightGoal: decimal("weight_goal", { precision: 5, scale: 2 }), // target weight in lbs
  targetBodyFat: decimal("target_body_fat", { precision: 4, scale: 1 }), // target body fat %
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  workouts: many(workouts),
  meals: many(meals),
  insights: many(insights),
  workoutPlans: many(workoutPlans),
  goals: one(userGoals),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
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
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(exercises, {
    fields: [sets.exerciseId],
    references: [exercises.id],
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

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
}));

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

export const insertWorkoutSchema = createInsertSchema(workouts)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .extend({
    date: z.union([z.date(), z.string()]).transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    }),
  });

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertSetSchema = createInsertSchema(sets).omit({
  id: true,
  createdAt: true,
});

export const insertMealSchema = createInsertSchema(meals)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .extend({
    date: z.union([z.date(), z.string()]).transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    }),
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

export const insertUserGoalsSchema = createInsertSchema(userGoals)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    weightGoal: z
      .union([z.number(), z.string()])
      .transform((val) => {
        if (typeof val === "number") {
          return val.toString();
        }
        return val;
      })
      .optional(),
    targetBodyFat: z
      .union([z.number(), z.string()])
      .transform((val) => {
        if (typeof val === "number") {
          return val.toString();
        }
        return val;
      })
      .optional(),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Set = typeof sets.$inferSelect;
export type InsertSet = z.infer<typeof insertSetSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type WorkoutPlanDay = typeof workoutPlanDays.$inferSelect;
export type InsertWorkoutPlanDay = z.infer<typeof insertWorkoutPlanDaySchema>;
export type UserGoals = typeof userGoals.$inferSelect;
export type InsertUserGoals = z.infer<typeof insertUserGoalsSchema>;
