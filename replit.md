# FitTracker Application

## Overview

FitTracker is a full-stack fitness and nutrition tracking application built with a modern JavaScript/TypeScript stack. The application allows users to log workouts and meals, track their fitness progress, and receive AI-powered insights about their health journey.

## System Architecture

The application follows a monorepo structure with a clear separation between frontend and backend:

- **Frontend**: React-based SPA with TypeScript, Vite for building, and Tailwind CSS for styling
- **Backend**: Express.js API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Authentication**: JWT-based authentication with bcrypt password hashing

### Architecture Decisions

1. **Monorepo Structure**: Keeps frontend, backend, and shared code in a single repository for easier development and deployment
2. **TypeScript Throughout**: Ensures type safety across the entire stack
3. **Drizzle ORM**: Provides type-safe database queries and schema management
4. **JWT Authentication**: Stateless authentication suitable for API-based architecture
5. **Component-First Frontend**: Uses shadcn/ui for consistent, accessible UI components

## Key Components

### Frontend (`client/`)
- **React with TypeScript**: Modern React patterns with hooks and context
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight client-side routing
- **Chart.js**: Data visualization for fitness metrics

### Backend (`server/`)
- **Express.js**: Web application framework
- **JWT Authentication**: Secure token-based authentication
- **Drizzle ORM**: Type-safe database operations
- **OpenAI Integration**: AI-powered insights generation
- **RESTful API**: Standard HTTP methods for CRUD operations

### Shared (`shared/`)
- **Database Schema**: Centralized schema definitions using Drizzle
- **Type Definitions**: Shared TypeScript types between frontend and backend

### Database Schema
- **Users**: User account management with authentication
- **Workouts**: Exercise tracking with duration, calories, and categorization
- **Meals**: Nutrition logging with calorie and macronutrient breakdown
- **Insights**: AI-generated recommendations and progress analysis

## Data Flow

1. **User Registration/Login**: Users create accounts or authenticate via JWT tokens
2. **Data Entry**: Users log workouts and meals through React forms
3. **API Processing**: Express server validates and stores data via Drizzle ORM
4. **Data Retrieval**: Frontend fetches data using TanStack Query for caching
5. **Insights Generation**: OpenAI API analyzes user data to provide personalized insights
6. **Visualization**: Chart.js renders progress charts and statistics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon database connection for PostgreSQL
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token handling
- **openai**: AI insights integration

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Styling framework
- **PostCSS**: CSS processing

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development**: `npm run dev` starts both frontend and backend in development mode
2. **Build**: `npm run build` compiles both frontend (Vite) and backend (esbuild)
3. **Production**: `npm start` runs the compiled application
4. **Database**: Uses Neon PostgreSQL with connection pooling
5. **Environment Variables**: Requires `DATABASE_URL`, `JWT_SECRET`, and `OPENAI_API_KEY`

### Build Process
- Frontend builds to `dist/public` for static serving
- Backend builds to `dist/index.js` as a single bundled file
- Drizzle migrations are managed via `npm run db:push`

## Changelog
- July 01, 2025: Initial setup - Complete health and fitness tracker with AI insights
  - Full-stack implementation with React frontend and Express backend
  - User authentication with JWT tokens
  - PostgreSQL database with Drizzle ORM
  - Workout and meal tracking with CRUD operations
  - Data visualization with Chart.js
  - AI-powered insights using OpenAI GPT-4o
  - Modern UI with Tailwind CSS and shadcn/ui components
  - Responsive design optimized for desktop and mobile

## User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Modern light theme with vibrant solid color buttons and industry-standard UX practices.