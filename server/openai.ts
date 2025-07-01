import OpenAI from "openai";
import { Workout, Meal } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface InsightData {
  workouts: Workout[];
  meals: Meal[];
  workoutStats: {
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
    avgDuration: number;
  };
  mealStats: {
    totalMeals: number;
    totalCalories: number;
    avgCalories: number;
    nutritionBreakdown: { protein: number; carbs: number; fat: number };
  };
}

export async function generateInsights(data: InsightData): Promise<Array<{
  type: string;
  title: string;
  content: string;
  data?: any;
}>> {
  try {
    const prompt = `
    Analyze the following fitness and nutrition data and provide personalized insights and recommendations.
    
    Workout Data:
    - Total workouts this week: ${data.workoutStats.totalWorkouts}
    - Total minutes exercised: ${data.workoutStats.totalMinutes}
    - Total calories burned: ${data.workoutStats.totalCalories}
    - Average workout duration: ${data.workoutStats.avgDuration} minutes
    - Recent workouts: ${JSON.stringify(data.workouts.slice(0, 10).map(w => ({
      type: w.type,
      duration: w.duration,
      date: w.date,
      calories: w.caloriesBurned
    })))}
    
    Meal Data:
    - Total meals logged: ${data.mealStats.totalMeals}
    - Total calories consumed: ${data.mealStats.totalCalories}
    - Average calories per meal: ${data.mealStats.avgCalories}
    - Nutrition breakdown: ${JSON.stringify(data.mealStats.nutritionBreakdown)}
    - Recent meals: ${JSON.stringify(data.meals.slice(0, 10).map(m => ({
      type: m.type,
      calories: m.calories,
      date: m.date,
      foodItems: m.foodItems
    })))}
    
    Please provide 3-4 personalized insights in JSON format with the following structure:
    {
      "insights": [
        {
          "type": "pattern|recommendation|achievement",
          "title": "Short descriptive title",
          "content": "Detailed insight or recommendation (2-3 sentences)",
          "data": {} // optional additional data
        }
      ]
    }
    
    Focus on:
    1. Activity patterns and trends
    2. Nutrition optimization recommendations
    3. Goal achievement recognition
    4. Behavioral insights and suggestions for improvement
    
    Make the insights specific, actionable, and encouraging.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness and nutrition coach providing personalized insights based on user data. Be encouraging, specific, and provide actionable recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.insights || [];
  } catch (error) {
    console.error("Error generating insights:", error);
    
    // Return fallback insights if OpenAI fails
    return [
      {
        type: "pattern",
        title: "Keep Up the Great Work!",
        content: "You're making progress on your fitness journey. Consistency is key to achieving your goals.",
        data: {}
      },
      {
        type: "recommendation",
        title: "Stay Hydrated",
        content: "Remember to drink plenty of water throughout the day, especially before and after workouts.",
        data: {}
      }
    ];
  }
}

export async function generateWorkoutRecommendations(recentWorkouts: Workout[]): Promise<string[]> {
  try {
    const workoutSummary = recentWorkouts.map(w => `${w.type} - ${w.duration}min`).join(", ");
    
    const prompt = `
    Based on these recent workouts: ${workoutSummary}
    
    Provide 3 specific workout recommendations to help improve variety and effectiveness.
    Return as JSON: { "recommendations": ["recommendation1", "recommendation2", "recommendation3"] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fitness expert providing workout recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating workout recommendations:", error);
    return [
      "Try adding more variety to your workout routine",
      "Consider incorporating strength training if you haven't already",
      "Remember to include rest days for recovery"
    ];
  }
}

export async function generateNutritionInsights(recentMeals: Meal[]): Promise<string[]> {
  try {
    const mealSummary = recentMeals.map(m => `${m.type}: ${m.calories}cal`).join(", ");
    
    const prompt = `
    Based on these recent meals: ${mealSummary}
    
    Provide 3 specific nutrition insights or recommendations.
    Return as JSON: { "insights": ["insight1", "insight2", "insight3"] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert providing dietary insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.insights || [];
  } catch (error) {
    console.error("Error generating nutrition insights:", error);
    return [
      "Focus on maintaining a balanced diet with adequate protein",
      "Consider adding more fruits and vegetables to your meals",
      "Stay consistent with your meal timing"
    ];
  }
}
