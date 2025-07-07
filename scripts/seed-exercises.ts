import { db } from "../server/db";
import { exerciseDatabase } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ExerciseData {
  id: string;
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
}

async function seedExercises() {
  try {
    console.log("Fetching exercise data from GitHub repository...");

    // Fetch the combined exercises JSON from the repository
    const response = await fetch(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.statusText}`);
    }

    const exercises: ExerciseData[] = await response.json();
    console.log(`Fetched ${exercises.length} exercises`);

    // Clear existing data
    console.log("Clearing existing exercise data...");
    await db.delete(exerciseDatabase);

    // Insert exercises in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);

      console.log(
        `Inserting batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          exercises.length / batchSize
        )}...`
      );

      const exercisesToInsert = batch.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        force: exercise.force || null,
        level: exercise.level || null,
        mechanic: exercise.mechanic || null,
        equipment: exercise.equipment || null,
        primaryMuscles: exercise.primaryMuscles || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        instructions: exercise.instructions || [],
        category: exercise.category || null,
        images: exercise.images || [],
      }));

      await db.insert(exerciseDatabase).values(exercisesToInsert);
      insertedCount += batch.length;

      console.log(`Inserted ${insertedCount} exercises so far...`);
    }

    console.log(
      `Successfully inserted ${insertedCount} exercises into the database!`
    );

    // Verify the data
    const count = await db.select().from(exerciseDatabase);
    console.log(`Database now contains ${count.length} exercises`);
  } catch (error) {
    console.error("Error seeding exercises:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedExercises()
  .then(() => {
    console.log("Exercise seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Exercise seeding failed:", error);
    process.exit(1);
  });
