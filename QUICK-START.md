# 🚀 Quick Start Guide

Get the E-Commerce Platform running in 5 minutes!

## Step 1: Start Development Environment

```bash
./start-dev.sh
```

That's it! The script will:
- ✅ Start PostgreSQL and Redis
- ✅ Run database migrations
- ✅ Install dependencies (if needed)
- ✅ Start backend and frontend
- ✅ Open development dashboard

## Step 2: Access Applications

### 🎛️ Development Dashboard
**http://localhost:8080**
- Central hub for all services
- Service status monitoring
- Quick links to all apps
- Documentation and commands

### 🔧 Backend API
**http://localhost:5000**
- REST API endpoints
- **Docs:** http://localhost:5000/api-docs

### 💻 Frontend Web App
**http://localhost:3000**
- Next.js web application
- Full e-commerce functionality

### 📱 Mobile Apps

**iOS:**
```bash
cd mobile && npm run ios
```

**Android:**
```bash
cd mobile && npm run android
```

## Step 3: Create Test User

### Option 1: Via API
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Option 2: Via Web UI
1. Go to http://localhost:3000/register
2. Fill in the form
3. Click "Create Account"

### Option 3: Via Mobile App
1. Open mobile app
2. Click "Sign Up"
3. Fill in details

## Step 4: Login & Test

Login with your test account:
- Email: `test@example.com`
- Password: `Test123!@#`

## Stopping Services

```bash
./stop-dev.sh
```

Or press `Ctrl+C` in the terminal running start-dev.sh

## 🔍 Inspection Tools

### Database Inspection
- **PgAdmin:** http://localhost:5050
  - Email: `admin@ecommerce.com`
  - Password: `admin123`
- **Prisma Studio:** `cd backend && npx prisma studio`

### API Testing
- **Swagger UI:** http://localhost:5000/api-docs
- **Postman Collection:** Download from dashboard

### Redis Inspection
```bash
docker-compose exec redis redis-cli
```

## 📱 Mobile Development

### For Physical Devices

1. Find your local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Update `mobile/.env`:
   ```bash
   API_URL=http://YOUR_LOCAL_IP:5000/api/v1
   ```

3. Run app on device

### Troubleshooting Mobile

**iOS not starting:**
```bash
cd mobile/ios && pod install && cd ../..
npm run ios
```

**Android not starting:**
```bash
cd mobile/android && ./gradlew clean && cd ../..
npm run android
```

## 🎯 What to Test

### Web App
1. ✅ User registration
2. ✅ Login / Logout
3. ✅ Browse products
4. ✅ Search functionality
5. ✅ Add to cart
6. ✅ Checkout process
7. ✅ View orders

### Mobile App
1. ✅ Welcome screen
2. ✅ Login with biometrics (if enabled)
3. ✅ Navigate tabs
4. ✅ Browse products
5. ✅ Add to cart
6. ✅ Profile management

### API
1. ✅ Test authentication endpoints
2. ✅ Get products
3. ✅ Cart operations
4. ✅ Order placement

## 📚 Documentation

- **Full Dev Guide:** [DEVELOPMENT.md](DEVELOPMENT.md)
- **Backend README:** [backend/README.md](backend/README.md)
- **Mobile README:** [mobile/README.md](mobile/README.md)
- **Main README:** [README.md](README.md)

## 🆘 Common Issues

### Port Already in Use
```bash
# Kill process on port
kill -9 $(lsof -ti:5000)  # Backend
kill -9 $(lsof -ti:3000)  # Frontend
```

### Database Connection Failed
```bash
docker-compose restart postgres
```

### Module Not Found
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

## 🎉 You're All Set!

Visit http://localhost:8080 for the full development dashboard and start building!

Happy coding! 🚀
