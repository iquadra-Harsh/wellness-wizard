#!/bin/bash

# FitTracker Docker Management Script
# Simple script to manage Docker containers for FitTracker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo "🐳 FitTracker Docker Management"
    echo "=============================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show container status"
    echo "  logs        Show logs for all services"
    echo "  logs-app    Show application logs"
    echo "  logs-db     Show database logs"
    echo "  logs-nginx  Show nginx logs"
    echo "  build       Rebuild all containers"
    echo "  clean       Stop and remove containers, networks, and volumes"
    echo "  db-shell    Open database shell"
    echo "  app-shell   Open application shell"
    echo "  health      Check service health"
    echo "  backup      Create database backup"
    echo "  dev         Start development environment"
    echo "  setup       Run initial setup"
    echo "  help        Show this help message"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to check service health
check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    # Check PostgreSQL
    if docker-compose exec -T postgres pg_isready -U fittracker_user -d fittracker_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not healthy${NC}"
    fi
    
    # Check Application
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${RED}❌ Application is not healthy${NC}"
    fi
    
    # Check Nginx
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx health check failed${NC}"
    fi
}

# Function to create database backup
create_backup() {
    echo -e "${BLUE}📦 Creating database backup...${NC}"
    
    # Create backups directory if it doesn't exist
    mkdir -p backups
    
    # Create backup filename with timestamp
    backup_file="backups/fittracker_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create backup
    docker-compose exec -T postgres pg_dump -U fittracker_user fittracker_db > "$backup_file"
    
    echo -e "${GREEN}✅ Database backup created: $backup_file${NC}"
}

# Main script logic
case "${1:-help}" in
    start)
        check_docker
        echo -e "${BLUE}🚀 Starting FitTracker services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ Services started${NC}"
        ;;
    
    stop)
        check_docker
        echo -e "${BLUE}🛑 Stopping FitTracker services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    
    restart)
        check_docker
        echo -e "${BLUE}🔄 Restarting FitTracker services...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    
    status)
        check_docker
        echo -e "${BLUE}📊 Container status:${NC}"
        docker-compose ps
        ;;
    
    logs)
        check_docker
        echo -e "${BLUE}📝 Showing logs (press Ctrl+C to exit):${NC}"
        docker-compose logs -f
        ;;
    
    logs-app)
        check_docker
        echo -e "${BLUE}📝 Showing application logs (press Ctrl+C to exit):${NC}"
        docker-compose logs -f fittracker-app
        ;;
    
    logs-db)
        check_docker
        echo -e "${BLUE}📝 Showing database logs (press Ctrl+C to exit):${NC}"
        docker-compose logs -f postgres
        ;;
    
    logs-nginx)
        check_docker
        echo -e "${BLUE}📝 Showing nginx logs (press Ctrl+C to exit):${NC}"
        docker-compose logs -f nginx
        ;;
    
    build)
        check_docker
        echo -e "${BLUE}🔧 Rebuilding containers...${NC}"
        docker-compose build
        echo -e "${GREEN}✅ Containers rebuilt${NC}"
        ;;
    
    clean)
        check_docker
        echo -e "${YELLOW}⚠️  This will remove all containers, networks, and volumes.${NC}"
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            echo -e "${BLUE}🧹 Cleaning up...${NC}"
            docker-compose down -v --remove-orphans
            docker-compose rm -f
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${BLUE}ℹ️  Cleanup cancelled${NC}"
        fi
        ;;
    
    db-shell)
        check_docker
        echo -e "${BLUE}🗄️  Opening database shell...${NC}"
        docker-compose exec postgres psql -U fittracker_user -d fittracker_db
        ;;
    
    app-shell)
        check_docker
        echo -e "${BLUE}🖥️  Opening application shell...${NC}"
        docker-compose exec fittracker-app sh
        ;;
    
    health)
        check_docker
        check_health
        ;;
    
    backup)
        check_docker
        create_backup
        ;;
    
    dev)
        check_docker
        echo -e "${BLUE}🔧 Starting development environment...${NC}"
        docker-compose -f docker-compose.dev.yml up -d
        echo -e "${GREEN}✅ Development environment started${NC}"
        ;;
    
    setup)
        echo -e "${BLUE}🚀 Running initial setup...${NC}"
        ./docker-setup.sh
        ;;
    
    help)
        show_help
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac