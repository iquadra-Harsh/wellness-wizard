# Summary

What: Track meals, workouts, and symptoms. AI provides personalized insights or recommendations (e.g., “You tend to work out less on Mondays; here’s how to build the habit”).

Depth: Data visualization, trends, basic ML for recommendations, user authentication.

Stack: React & TailwindCSS, NodeJS backend, PostgreSQL database, AI for insights.

## 🟢 MVP Goals & Features
1. User Authentication
Sign up, login, logout

Secure password storage (hashing)

JWT-based auth for frontend/backend (or session if you prefer)

2. User Dashboard
Overview of recent activities and stats (summary: this week’s workouts, meals, etc.)

3. Workout Tracking
Log workouts (type, date, duration, notes)

View/edit/delete previous workouts

Optionally: tag workouts (cardio, strength, flexibility)

4. Meal Tracking
Log meals (food items, calories, date/time, notes)

View/edit/delete previous meals

5. Data Visualization
Graphs of workout frequency, calories, progress over time

Simple charts: e.g. workouts per week, calories per day, etc.

6. AI-Powered Insights & Recommendations
Summarize activity ("You worked out 4 times this week, great job!")

Personalized tip for growth ("Try to add one more cardio session next week.")

Suggestions based on recent patterns (e.g. "You tend to skip workouts on Fridays. Plan a short walk instead.")

7. Responsive UI
Works well on both desktop and mobile screens

## 🟡 Stretch Goals (Post-MVP)
1. Advanced Analytics
Deeper insights: streaks, plateaus, best/worst weeks

Goal setting and tracking (weight, calories, number of workouts)

2. Habit & Symptom Tracking
Users can track sleep, water intake, symptoms, etc.

Correlate habits with progress

3. Social Features
Friends, sharing achievements, “challenge a friend”

Leaderboards

4. Reminders & Notifications
Schedule reminders for workouts or meals (email or push)

5. Integration with Devices/APIs
Sync with Google Fit, Apple Health, Fitbit, etc.

6. Recipe/Meal Suggestions
AI can suggest healthy recipes based on dietary preferences

7. Voice Input
Log meals or workouts via voice (browser Speech API or Whisper API)

8. Export Data
Export progress/reports as CSV or PDF


# Important Commands
1. npm run dev

2. npm run db:push

3. npx tsx scripts/seed-exercises.ts

4. eval "$(ssh-agent -s)"

5. ssh-add PATH-TO-SSH-KEY