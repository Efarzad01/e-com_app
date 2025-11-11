#!/bin/bash

# E-Commerce Platform Development Environment Shutdown Script

set -e

echo "🛑 Stopping E-Commerce Platform Development Environment"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Stop all Node.js processes for this project
print_status "Stopping Node.js services..."
pkill -f "npm run dev" || true
pkill -f "next dev" || true
pkill -f "nodemon" || true

# Stop Python HTTP server for dashboard
print_status "Stopping development dashboard..."
pkill -f "python3 -m http.server 8080" || true

# Stop Docker services
print_status "Stopping Docker containers..."
docker-compose down

print_success "All services stopped!"
echo ""
echo "To start again, run: ./start-dev.sh"
