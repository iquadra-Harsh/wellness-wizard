#!/bin/bash

# FitTracker Docker Setup Script
# This script sets up the complete Docker environment for FitTracker

set -e

echo "🐳 FitTracker Docker Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p postgres_data

# Check if .env.docker.local exists
if [ ! -f ".env.docker.local" ]; then
    echo -e "${YELLOW}⚠️  .env.docker.local not found. Creating from template...${NC}"
    cp .env.docker .env.docker.local
    echo -e "${YELLOW}📝 Please edit .env.docker.local with your actual values:${NC}"
    echo -e "${YELLOW}   - JWT_SECRET: Generate a secure random string${NC}"
    echo -e "${YELLOW}   - OPENAI_API_KEY: Get from https://platform.openai.com/api-keys${NC}"
    echo ""
    read -p "Press Enter to continue after updating .env.docker.local..."
fi

# Load environment variables
if [ -f ".env.docker.local" ]; then
    export $(cat .env.docker.local | xargs)
fi

# Build and start services
echo "🔧 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U fittracker_user -d fittracker_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for PostgreSQL... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ PostgreSQL failed to start after $max_attempts attempts${NC}"
    exit 1
fi

# Push database schema
echo "🗄️  Setting up database schema..."
docker-compose exec -T fittracker-app npm run db:push

# Seed exercises if the script exists
if [ -f "scripts/seed-exercises.ts" ]; then
    echo "🌱 Seeding exercise database..."
    docker-compose exec -T fittracker-app npx tsx scripts/seed-exercises.ts
fi

# Check application health
echo "🏥 Checking application health..."
max_attempts=10
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for application... ($attempt/$max_attempts)"
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Application failed to start after $max_attempts attempts${NC}"
    echo "Check logs with: docker-compose logs fittracker-app"
    exit 1
fi

# Check nginx
echo "🌐 Checking nginx..."
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx health check failed, but continuing...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 FitTracker is now running!${NC}"
echo ""
echo "📱 Application URLs:"
echo "   - Main app: http://localhost"
echo "   - Direct app: http://localhost:5000"
echo "   - Health check: http://localhost:5000/api/health"
echo ""
echo "🐳 Docker Management:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - View running containers: docker-compose ps"
echo ""
echo "🗃️  Database Access:"
echo "   - Host: localhost:5432"
echo "   - Database: fittracker_db"
echo "   - Username: fittracker_user"
echo "   - Password: fittracker_password"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Logs are stored in ./logs/nginx/ directory"
echo "   - Database data persists in Docker volume 'postgres_data'"
echo "   - Update .env.docker.local and restart to change configuration"
echo ""