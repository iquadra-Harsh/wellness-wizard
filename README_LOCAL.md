# FitTracker - Local Setup

A comprehensive health and fitness tracker with AI-powered insights. Track workouts, meals, and get personalized recommendations.

## Features

- 🏋️‍♀️ **Workout Tracking** - Log exercises with duration, calories, and notes
- 🍎 **Meal Logging** - Track nutrition with calorie and macro breakdown  
- 📊 **Progress Visualization** - Charts showing your fitness trends
- 🤖 **AI Insights** - Personalized recommendations based on your activity
- 🔒 **Secure Authentication** - JWT-based user accounts
- 📱 **Responsive Design** - Works great on desktop and mobile

## Quick Start (Local Development)

1. **Prerequisites**: Install Node.js, PostgreSQL, and pgAdmin
2. **Run setup**: `node setup-local.js`
3. **Configure**: Edit `.env` with your PostgreSQL credentials
4. **Start app**: `npm run dev`
5. **Open**: http://localhost:5000

For detailed setup instructions, see [LOCAL_SETUP.md](LOCAL_SETUP.md)

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, JWT Authentication
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o for insights
- **Charts**: Chart.js for data visualization

## Original Project Goals

### MVP Features (Completed)
1. ✅ User Authentication - Sign up, login, logout with JWT
2. ✅ User Dashboard - Overview of recent activities and stats
3. ✅ Workout Tracking - Log workouts with type, duration, calories, notes
4. ✅ Meal Tracking - Log meals with food items, calories, macros
5. ✅ Data Visualization - Charts showing workout frequency and progress
6. ✅ AI-Powered Insights - Personalized tips and recommendations
7. ✅ Responsive UI - Works on desktop and mobile

### Future Enhancements
- Advanced Analytics (streaks, goals, detailed insights)
- Habit & Symptom Tracking (sleep, water, correlations)
- Social Features (friends, challenges, leaderboards)
- Reminders & Notifications
- Device Integration (Google Fit, Apple Health)
- Recipe Suggestions
- Voice Input
- Data Export