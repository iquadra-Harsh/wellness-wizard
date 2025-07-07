# FitTracker Docker Quick Start

Get your FitTracker application running in Docker containers with just a few commands.

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (optional, for AI insights)

## 🚀 One-Command Setup

```bash
# Clone the repository and run setup
git clone <your-repo-url>
cd fittracker
./docker-setup.sh
```

The setup script will:
✅ Create all necessary directories
✅ Build Docker images
✅ Start all services (app, database, nginx)
✅ Initialize the database
✅ Seed the exercise database
✅ Perform health checks

## 🔧 Manual Setup

If you prefer step-by-step:

```bash
# 1. Configure environment
cp .env.docker .env.docker.local
# Edit .env.docker.local with your OpenAI API key

# 2. Start services
docker-compose up -d

# 3. Setup database
docker-compose exec fittracker-app npm run db:push
docker-compose exec fittracker-app npx tsx scripts/seed-exercises.ts
```

## 🌐 Access Your Application

Once running:
- **Main app**: http://localhost
- **Direct access**: http://localhost:5000
- **Health check**: http://localhost:5000/api/health

## 🛠️ Management Commands

Use the management script for easy container operations:

```bash
# View status
./docker-manage.sh status

# View logs
./docker-manage.sh logs

# Stop services
./docker-manage.sh stop

# Start services
./docker-manage.sh start

# Database shell
./docker-manage.sh db-shell

# Full cleanup
./docker-manage.sh clean
```

## 🗃️ Database Access

Connect to PostgreSQL:
- Host: localhost:5432
- Database: fittracker_db
- User: fittracker_user
- Password: fittracker_password

## 🔍 Troubleshooting

**Services won't start?**
```bash
./docker-manage.sh logs
```

**Database connection issues?**
```bash
./docker-manage.sh health
```

**Need to rebuild?**
```bash
./docker-manage.sh build
./docker-manage.sh restart
```

## 🔒 Security Features

- Rate limiting on API endpoints
- Security headers via Nginx
- Non-root container execution
- Network isolation between services
- Health monitoring

## 📊 What's Included

- **FitTracker App**: Full React + Express application
- **PostgreSQL**: Persistent database with automatic setup
- **Nginx**: Reverse proxy with load balancing
- **Health Checks**: Automated monitoring
- **Logging**: Centralized log management
- **Backup Tools**: Database backup utilities

Your FitTracker application is now containerized and ready for consistent deployment across any environment!