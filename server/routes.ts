import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";
import { insertUserSchema, loginUserSchema, insertWorkoutSchema, insertMealSchema } from "@shared/schema";
import { generateInsights } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                          await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "User with this username or email already exists" 
        });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          name: user.name 
        }, 
        token 
      });
    } catch (error: any) {
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
          name: user.name 
        }, 
        token 
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
        name: user.name 
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
      res.status(500).json({ message: error.message || "Failed to get workouts" });
    }
  });

  app.post("/api/workouts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout({
        ...workoutData,
        userId: req.userId!,
      });
      res.json(workout);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create workout" });
    }
  });

  app.put("/api/workouts/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const workoutData = insertWorkoutSchema.partial().parse(req.body);
      
      const workout = await storage.updateWorkout(id, req.userId!, workoutData);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.json(workout);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkout(id, req.userId!);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.json({ message: "Workout deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete workout" });
    }
  });

  app.get("/api/workouts/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const stats = await storage.getWorkoutStats(req.userId!, days);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get workout stats" });
    }
  });

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
      res.status(400).json({ message: error.message || "Failed to create meal" });
    }
  });

  app.put("/api/meals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealData = insertMealSchema.partial().parse(req.body);
      
      const meal = await storage.updateMeal(id, req.userId!, mealData);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(meal);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update meal" });
    }
  });

  app.delete("/api/meals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMeal(id, req.userId!);
      
      if (!deleted) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json({ message: "Meal deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete meal" });
    }
  });

  app.get("/api/meals/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const days = parseInt(req.query.days as string) || 1;
      const stats = await storage.getMealStats(req.userId!, days);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get meal stats" });
    }
  });

  // Insight routes
  app.get("/api/insights", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const insights = await storage.getInsights(req.userId!);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get insights" });
    }
  });

  app.post("/api/insights/generate", authenticateToken, async (req: AuthRequest, res) => {
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
        insights.map(insight => 
          storage.createInsight({
            ...insight,
            userId: req.userId!,
          })
        )
      );

      res.json(savedInsights);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate insights" });
    }
  });

  app.put("/api/insights/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markInsightAsRead(id, req.userId!);
      
      if (!success) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      res.json({ message: "Insight marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to mark insight as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
