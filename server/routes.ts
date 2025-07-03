import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  authenticateToken,
  generateToken,
  hashPassword,
  comparePassword,
  type AuthRequest,
} from "./auth";
import {
  insertUserSchema,
  loginUserSchema,
  insertWorkoutSchema,
  insertMealSchema,
  insertWorkoutPlanSchema,
} from "@shared/schema";
import { generateInsights } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    console.log("Registering user:", req.body);

    try {
      console.log("Parsing user data...");
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed data:", userData);

      console.log("Checking for existing user...");
      const existingUser =
        (await storage.getUserByUsername(userData.username)) ||
        (await storage.getUserByEmail(userData.email));

      if (existingUser) {
        console.log("User already exists:", existingUser);
        return res.status(400).json({
          message: "User with this username or email already exists",
        });
      }

      console.log("Hashing password...");
      const hashedPassword = await hashPassword(userData.password);

      console.log("Creating user...");
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      console.log("User created:", user);

      const token = generateToken(user.id);
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error); // Add this line
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginUserSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get user" });
    }
  });

  // Workout routes
  app.get("/api/workouts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const workouts = await storage.getWorkouts(req.userId!);
      res.json(workouts);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Failed to get workouts" });
    }
  });

  app.post(
    "/api/workouts",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { workout: workoutData, exercises } = req.body;
        const parsedWorkoutData = insertWorkoutSchema.parse(workoutData);

        const workout = await storage.createWorkout(
          {
            ...parsedWorkoutData,
            userId: req.userId!,
          },
          exercises
        );

        res.json(workout);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to create workout" });
      }
    }
  );

  app.put(
    "/api/workouts/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const { workout: workoutData, exercises: exerciseData } = req.body;
        const parsedWorkoutData = insertWorkoutSchema
          .partial()
          .parse(workoutData);

        const workout = await storage.updateWorkout(
          id,
          req.userId!,
          parsedWorkoutData,
          exerciseData
        );
        if (!workout) {
          return res.status(404).json({ message: "Workout not found" });
        }

        res.json(workout);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to update workout" });
      }
    }
  );

  app.delete(
    "/api/workouts/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteWorkout(id, req.userId!);

        if (!deleted) {
          return res.status(404).json({ message: "Workout not found" });
        }

        res.json({ message: "Workout deleted successfully" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to delete workout" });
      }
    }
  );

  app.get(
    "/api/workouts/stats",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const days = parseInt(req.query.days as string) || 7;
        const stats = await storage.getWorkoutStats(req.userId!, days);
        res.json(stats);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to get workout stats" });
      }
    }
  );

  // Meal routes
  app.get("/api/meals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const meals = await storage.getMeals(req.userId!);
      res.json(meals);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get meals" });
    }
  });

  app.post("/api/meals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal({
        ...mealData,
        userId: req.userId!,
      });
      res.json(meal);
    } catch (error: any) {
      res
        .status(400)
        .json({ message: error.message || "Failed to create meal" });
    }
  });

  app.put(
    "/api/meals/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const mealData = insertMealSchema.partial().parse(req.body);

        const meal = await storage.updateMeal(id, req.userId!, mealData);
        if (!meal) {
          return res.status(404).json({ message: "Meal not found" });
        }

        res.json(meal);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to update meal" });
      }
    }
  );

  app.delete(
    "/api/meals/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteMeal(id, req.userId!);

        if (!deleted) {
          return res.status(404).json({ message: "Meal not found" });
        }

        res.json({ message: "Meal deleted successfully" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to delete meal" });
      }
    }
  );

  app.get(
    "/api/meals/stats",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const days = parseInt(req.query.days as string) || 1;
        const stats = await storage.getMealStats(req.userId!, days);
        res.json(stats);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to get meal stats" });
      }
    }
  );

  // Insight routes
  app.get("/api/insights", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const insights = await storage.getInsights(req.userId!);
      res.json(insights);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Failed to get insights" });
    }
  });

  app.post(
    "/api/insights/generate",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const workouts = await storage.getWorkouts(req.userId!, 30);
        const meals = await storage.getMeals(req.userId!, 30);
        const workoutStats = await storage.getWorkoutStats(req.userId!, 30);
        const mealStats = await storage.getMealStats(req.userId!, 7);

        const insights = await generateInsights({
          workouts,
          meals,
          workoutStats,
          mealStats,
        });

        // Save insights to database
        const savedInsights = await Promise.all(
          insights.map((insight) =>
            storage.createInsight({
              ...insight,
              userId: req.userId!,
            })
          )
        );

        res.json(savedInsights);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to generate insights" });
      }
    }
  );

  app.put(
    "/api/insights/:id/read",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.markInsightAsRead(id, req.userId!);

        if (!success) {
          return res.status(404).json({ message: "Insight not found" });
        }

        res.json({ message: "Insight marked as read" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to mark insight as read" });
      }
    }
  );

  // Workout Plan routes
  app.get(
    "/api/workout-plans",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const plans = await storage.getWorkoutPlans(req.userId!);
        res.json(plans);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to get workout plans" });
      }
    }
  );

  app.get(
    "/api/workout-plans/active",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const activePlan = await storage.getActiveWorkoutPlan(req.userId!);
        res.json(activePlan);
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: error.message || "Failed to get active workout plan",
          });
      }
    }
  );

  app.get(
    "/api/workout-plans/next-day",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const nextDay = await storage.getNextWorkoutDay(req.userId!);
        res.json(nextDay);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to get next workout day" });
      }
    }
  );

  app.post(
    "/api/workout-plans",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { plan, days } = req.body;
        const planData = insertWorkoutPlanSchema.parse(plan);

        const newPlan = await storage.createWorkoutPlan(
          { ...planData, userId: req.userId! },
          days
        );
        res.json(newPlan);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to create workout plan" });
      }
    }
  );

  app.put(
    "/api/workout-plans/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const planData = insertWorkoutPlanSchema.partial().parse(req.body);

        const plan = await storage.updateWorkoutPlan(id, req.userId!, planData);
        if (!plan) {
          return res.status(404).json({ message: "Workout plan not found" });
        }

        res.json(plan);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to update workout plan" });
      }
    }
  );

  app.delete(
    "/api/workout-plans/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteWorkoutPlan(id, req.userId!);

        if (!success) {
          return res.status(404).json({ message: "Workout plan not found" });
        }

        res.json({ message: "Workout plan deleted successfully" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to delete workout plan" });
      }
    }
  );

  app.post(
    "/api/workout-plans/:id/advance",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.advanceWorkoutPlan(req.userId!, id);
        res.json({ message: "Workout plan advanced successfully" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to advance workout plan" });
      }
    }
  );

  // User Goals routes
  app.get(
    "/api/user-goals",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const goals = await storage.getUserGoals(req.userId!);
        if (!goals) {
          // Create default goals if none exist
          const defaultGoals = await storage.createUserGoals({
            userId: req.userId!,
            weeklyWorkoutGoal: 4,
            dailyCalorieGoal: 2000,
            hydrationGoal: 8,
          });
          return res.json(defaultGoals);
        }
        res.json(goals);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to get user goals" });
      }
    }
  );

  app.put(
    "/api/user-goals",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { insertUserGoalsSchema } = await import("@shared/schema");
        const goalsData = insertUserGoalsSchema.parse(req.body);

        const existingGoals = await storage.getUserGoals(req.userId!);

        let updatedGoals;
        if (existingGoals) {
          updatedGoals = await storage.updateUserGoals(req.userId!, goalsData);
        } else {
          updatedGoals = await storage.createUserGoals({
            ...goalsData,
            userId: req.userId!,
          });
        }

        res.json(updatedGoals);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: error.message || "Failed to update user goals" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
