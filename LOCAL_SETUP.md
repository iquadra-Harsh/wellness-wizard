# Local Development Setup Guide

This guide will help you run the FitTracker application on your local machine with PostgreSQL.

## Prerequisites

Before starting, make sure you have these installed:
- Node.js (version 18 or higher)
- npm or yarn
- PostgreSQL (version 12 or higher)
- pgAdmin (for database management)

## Step 1: Install PostgreSQL and pgAdmin

### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. pgAdmin is included with the PostgreSQL installation

### macOS:
1. Install via Homebrew: `brew install postgresql`
2. Start PostgreSQL: `brew services start postgresql`
3. Download pgAdmin from https://www.pgadmin.org/download/

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Set Up the Database

### Using pgAdmin:
1. Open pgAdmin
2. Connect to your PostgreSQL server (usually localhost:5432)
3. Right-click on "Databases" and select "Create > Database"
4. Name it `fittracker_db`
5. Click "Save"

### Using Command Line:
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE fittracker_db;

# Create a user (optional)
CREATE USER fittracker_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fittracker_db TO fittracker_user;

# Exit
\q
```

## Step 3: Clone and Set Up the Project

1. **Clone the repository** (or download the project files)
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fittracker_db
   
   # Or if you created a custom user:
   # DATABASE_URL=postgresql://fittracker_user:your_password@localhost:5432/fittracker_db
   
   # JWT Secret (generate a random string)
   JWT_SECRET=your_jwt_secret_key_here
   
   # OpenAI API Key (get from https://platform.openai.com/api-keys)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Environment
   NODE_ENV=development
   ```

## Step 4: Set Up the Database Schema

Run the following command to create all the necessary tables:

```bash
npm run db:push
```

This will create the following tables:
- `users` - User accounts and authentication
- `workouts` - Exercise tracking data
- `meals` - Nutrition and meal logging
- `insights` - AI-generated recommendations

## Step 5: Start the Application

Start the development server:

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

## Step 6: Verify Everything Works

1. **Check the database connection:**
   - Open pgAdmin
   - Navigate to your `fittracker_db` database
   - You should see the tables created under Schemas > public > Tables

2. **Test the application:**
   - Open http://localhost:5000 in your browser
   - Register a new account
   - Try logging in
   - Add a workout or meal entry

## Troubleshooting

### Database Connection Issues:
- Make sure PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Services (Windows)
- Verify your DATABASE_URL in the `.env` file
- Check if the database exists in pgAdmin

### Port Conflicts:
- If port 5000 is in use, you can change it in `server/index.ts`
- Update the port number and restart the application

### Missing Environment Variables:
- Make sure your `.env` file is in the root directory
- Restart the application after making changes to `.env`

### Database Schema Issues:
- Run `npm run db:push` again to ensure tables are created
- Check the console for any error messages

## Database Management with pgAdmin

### Viewing Data:
1. Open pgAdmin
2. Navigate to: Servers > PostgreSQL > Databases > fittracker_db > Schemas > public > Tables
3. Right-click on any table and select "View/Edit Data > All Rows"

### Backup Database:
1. Right-click on `fittracker_db`
2. Select "Backup..."
3. Choose your backup location and settings

### Restore Database:
1. Right-click on "Databases"
2. Select "Restore..."
3. Choose your backup file

## Development Tips

- **Hot Reload:** The application supports hot reload for both frontend and backend changes
- **Database Changes:** After modifying the schema in `shared/schema.ts`, run `npm run db:push`
- **API Testing:** Use tools like Postman or curl to test API endpoints at `http://localhost:5000/api`
- **Logs:** Check the console for detailed error messages and debugging info

## Production Deployment

For production deployment, you'll need to:
1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Set secure JWT_SECRET and OPENAI_API_KEY
4. Build the application: `npm run build`
5. Start with: `npm start`

## Getting API Keys

### OpenAI API Key:
1. Visit https://platform.openai.com/
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Add it to your `.env` file

The AI insights feature requires this key to generate personalized fitness and nutrition recommendations.