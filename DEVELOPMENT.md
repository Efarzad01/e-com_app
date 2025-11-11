# Development Environment Guide

Complete guide for setting up and inspecting the E-Commerce Platform development environment.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Running the Applications](#running-the-applications)
5. [Inspecting Applications](#inspecting-applications)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

The fastest way to get started:

```bash
# Make sure you're in the project root
cd e-com_app

# Start all services
./start-dev.sh

# Open your browser to http://localhost:8080
# The development dashboard will guide you!
```

## 📦 Prerequisites

Before starting, ensure you have:

### Required
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### For Mobile Development
- **Xcode** 14+ (macOS only - for iOS)
- **Android Studio** (for Android)
- **CocoaPods** (macOS only): `sudo gem install cocoapods`

### Recommended
- **Visual Studio Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - React Native Tools

## ⚙️ Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd e-com_app
```

### 2. Install Dependencies

All services:
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Mobile
cd mobile && npm install && cd ..
```

### 3. Configure Environment Variables

Environment files are already created for you:
- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration
- `mobile/.env` - Mobile app configuration

**Important:** For production, you MUST change:
- JWT secrets
- Database passwords
- API keys (Stripe, OAuth providers)

### 4. Set Up Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with test data
npm run seed
```

## 🎮 Running the Applications

### Method 1: One-Command Startup (Recommended)

```bash
./start-dev.sh
```

This script will:
1. Start PostgreSQL and Redis in Docker
2. Run database migrations
3. Start the backend API
4. Start the frontend web app
5. Open the development dashboard

### Method 2: Manual Startup

**Terminal 1 - Docker Services:**
```bash
docker-compose up postgres redis
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - Mobile (iOS):**
```bash
cd mobile
npm run ios
```

**Terminal 5 - Mobile (Android):**
```bash
cd mobile
npm run android
```

### Method 3: Docker Compose (Full Stack)

```bash
docker-compose up
```

This starts everything in containers.

## 🔍 Inspecting Applications

### Development Dashboard

Visit **http://localhost:8080** for the central development dashboard.

From here you can:
- Check service status
- Access all applications
- View API documentation
- Manage databases
- Get quick commands

### Web Applications

| Application | URL | Description |
|------------|-----|-------------|
| **Dashboard** | http://localhost:8080 | Development dashboard |
| **Backend API** | http://localhost:5000 | REST API |
| **API Docs** | http://localhost:5000/api-docs | Swagger documentation |
| **Frontend** | http://localhost:3000 | Next.js web app |
| **PgAdmin** | http://localhost:5050 | Database management |
| **Prisma Studio** | http://localhost:5555 | Visual database editor |

### Mobile Applications

#### iOS Simulator

```bash
cd mobile

# Run on default simulator
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"

# List available simulators
xcrun simctl list devices
```

#### Android Emulator

```bash
cd mobile

# Start emulator and run app
npm run android

# List available devices
adb devices

# Connect to specific device
npm run android -- --deviceId=emulator-5554
```

#### Physical Devices

1. **Update API URL in `mobile/.env`:**
   ```bash
   # Find your local IP
   # macOS/Linux: ifconfig | grep inet
   # Windows: ipconfig

   # Update .env
   API_URL=http://192.168.1.100:5000/api/v1
   ```

2. **Connect device:**
   - iOS: Connect via USB, trust computer, enable developer mode
   - Android: Enable developer options, USB debugging

3. **Run app:**
   ```bash
   npm run ios -- --device
   # or
   npm run android -- --deviceId=YOUR_DEVICE_ID
   ```

### Database Inspection

#### Option 1: PgAdmin (Visual)

1. Open http://localhost:5050
2. Login:
   - Email: `admin@ecommerce.com`
   - Password: `admin123`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres123`

#### Option 2: Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555

#### Option 3: psql CLI

```bash
docker-compose exec postgres psql -U postgres -d ecommerce
```

Common commands:
```sql
\dt              -- List tables
\d table_name    -- Describe table
SELECT * FROM users LIMIT 10;
```

### Redis Inspection

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Common commands
KEYS *           # List all keys
GET key_name     # Get value
SET key value    # Set value
FLUSHALL         # Clear all data (careful!)
```

### API Testing

#### Swagger UI

1. Open http://localhost:5000/api-docs
2. Click "Authorize" and enter JWT token
3. Test endpoints directly

#### Get JWT Token

```bash
# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### Test Endpoints

```bash
# Get products (no auth required)
curl http://localhost:5000/api/v1/products

# Get user profile (auth required)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Common Tasks

### Create a New User

```bash
# Via API
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "firstName": "New",
    "lastName": "User"
  }'
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npm run seed  # If you have seed data
```

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Run Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test

# Mobile tests
cd mobile
npm test
```

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Mobile iOS
cd mobile/ios
xcodebuild -workspace ECommerce.xcworkspace -scheme ECommerce archive

# Mobile Android
cd mobile/android
./gradlew assembleRelease
```

### Clear Cache

```bash
# Backend
cd backend
rm -rf node_modules dist
npm install

# Frontend
cd frontend
rm -rf node_modules .next
npm install

# Mobile
cd mobile
rm -rf node_modules
npm install
# iOS
cd ios && pod install && cd ..
# Android
cd android && ./gradlew clean && cd ..

# Docker
docker-compose down -v
docker system prune -a
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -ti:5000  # Backend
lsof -ti:3000  # Frontend
lsof -ti:8080  # Dashboard

# Kill process
kill -9 $(lsof -ti:5000)
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Frontend Not Loading

```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Mobile App Not Starting

**iOS:**
```bash
cd mobile/ios
pod deintegrate
pod install
cd ..
npm run ios
```

**Android:**
```bash
cd mobile/android
./gradlew clean
cd ..
npm run android
```

### "Module not found" Errors

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Metro bundler cache (mobile)
npm start -- --reset-cache
```

### Database Migration Errors

```bash
cd backend

# Reset migrations
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name fix_migration

# Generate Prisma client
npx prisma generate
```

## 📱 Mobile Development Tips

### Hot Reloading

- **iOS:** Cmd + D (simulator) → Enable Fast Refresh
- **Android:** Cmd + M (or shake device) → Enable Hot Reloading

### Debugging

**iOS:**
1. Open Developer menu (Cmd + D)
2. Select "Debug"
3. Opens Chrome DevTools

**Android:**
1. Open Developer menu (Cmd + M)
2. Select "Debug"
3. Opens Chrome DevTools

Or use:
```bash
# React Native Debugger
npx react-devtools
```

### View Device Logs

**iOS:**
```bash
# View logs
xcrun simctl spawn booted log stream --predicate 'process == "ECommerce"'
```

**Android:**
```bash
# View logs
adb logcat *:S ReactNative:V ReactNativeJS:V
```

## 🔐 Default Credentials

### Development Users

Create these users for testing:

```javascript
// Customer
email: customer@test.com
password: Customer123!

// Seller
email: seller@test.com
password: Seller123!

// Admin
email: admin@test.com
password: Admin123!
```

### Database Access

**PostgreSQL:**
- Host: localhost
- Port: 5432
- Database: ecommerce
- User: postgres
- Password: postgres123

**PgAdmin:**
- URL: http://localhost:5050
- Email: admin@ecommerce.com
- Password: admin123

**Redis:**
- Host: localhost
- Port: 6379
- No password (development)

## 📊 Performance Monitoring

### Backend Performance

```bash
# API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/v1/products
```

### Frontend Performance

Open Chrome DevTools:
- Network tab for load times
- Performance tab for rendering
- Lighthouse for audits

### Mobile Performance

Use React Native's performance monitor:
1. Open developer menu
2. Select "Show Perf Monitor"

## 🔄 Keeping Environment Updated

```bash
# Update dependencies
cd backend && npm update && cd ..
cd frontend && npm update && cd ..
cd mobile && npm update && cd ..

# Update Docker images
docker-compose pull

# Update Prisma
cd backend
npm install prisma@latest @prisma/client@latest
npx prisma generate
```

## 📚 Additional Resources

- [Backend API Documentation](http://localhost:5000/api-docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Check the logs in the `logs/` directory
3. Visit http://localhost:8080 for service status
4. Search for error messages in documentation

## 🎯 Next Steps

After setting up:

1. ✅ Create test users
2. ✅ Add products via API
3. ✅ Test shopping cart flow
4. ✅ Test checkout process
5. ✅ Try mobile apps on simulators
6. ✅ Inspect database with PgAdmin
7. ✅ Read API documentation

Happy developing! 🚀
