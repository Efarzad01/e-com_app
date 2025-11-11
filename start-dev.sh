#!/bin/bash

# E-Commerce Platform Development Environment Startup Script
# This script starts all services for development

set -e

echo "🚀 Starting E-Commerce Platform Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking Docker services..."

# Start Docker services (PostgreSQL and Redis)
print_status "Starting PostgreSQL and Redis with Docker Compose..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        print_error "PostgreSQL failed to start within ${timeout} seconds"
        exit 1
    fi
    sleep 1
done
print_success "PostgreSQL is ready!"

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
counter=0
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        print_error "Redis failed to start within ${timeout} seconds"
        exit 1
    fi
    sleep 1
done
print_success "Redis is ready!"

# Check if node_modules exist in backend
if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not installed. Installing now..."
    cd backend && npm install && cd ..
fi

# Run database migrations
print_status "Running database migrations..."
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
print_success "Database migrations completed!"

# Check if node_modules exist in frontend
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend dependencies not installed. Installing now..."
    cd frontend && npm install && cd ..
fi

# Open development dashboard in default browser
print_status "Opening development dashboard..."
sleep 2

# Detect OS and open browser
case "$(uname -s)" in
    Darwin*)
        open http://localhost:8080
        ;;
    Linux*)
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8080
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        start http://localhost:8080
        ;;
esac

echo ""
print_success "Development environment is starting!"
echo ""
echo "=================================================="
echo "📊 Service URLs:"
echo "=================================================="
echo "🌐 Development Dashboard: http://localhost:8080"
echo "🔧 Backend API:           http://localhost:5000"
echo "📚 API Documentation:     http://localhost:5000/api-docs"
echo "💻 Frontend Web:          http://localhost:3000"
echo "🗄️  Database (PostgreSQL): localhost:5432"
echo "⚡ Redis:                  localhost:6379"
echo "🔍 PgAdmin:               http://localhost:5050"
echo "   Login: admin@ecommerce.com / admin123"
echo ""
echo "=================================================="
echo "📱 Mobile App Commands:"
echo "=================================================="
echo "iOS:     cd mobile && npm run ios"
echo "Android: cd mobile && npm run android"
echo ""
echo "=================================================="
echo "⚠️  Press Ctrl+C to stop all services"
echo "=================================================="
echo ""

# Start the backend and frontend in parallel using npm-run-all or concurrently
# For now, we'll use a simple approach with & and wait

# Start backend
print_status "Starting Backend API..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 3

# Start frontend
print_status "Starting Frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Start development dashboard
print_status "Starting Development Dashboard..."
cd dev-dashboard
python3 -m http.server 8080 > ../logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!
cd ..

# Function to handle cleanup
cleanup() {
    echo ""
    print_warning "Shutting down services..."

    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$DASHBOARD_PID" ]; then
        kill $DASHBOARD_PID 2>/dev/null || true
    fi

    # Stop Docker services
    print_status "Stopping Docker services..."
    docker-compose down

    print_success "All services stopped!"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
