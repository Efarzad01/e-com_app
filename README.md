# Production-Ready E-Commerce Platform

A full-stack, production-ready e-commerce platform similar to Amazon, built with modern technologies and comprehensive security features.

## 🚀 Features

### Core Functionality
- ✅ **User Authentication & Authorization**
  - JWT-based authentication (access + refresh tokens)
  - Email verification
  - Password reset functionality
  - Two-factor authentication (2FA) with TOTP
  - OAuth2 integration (Google, Facebook)
  - Role-based access control (Customer, Seller, Admin)

- ✅ **Product Management**
  - Complete CRUD operations
  - Advanced search and filtering
  - Product variants (size, color, etc.)
  - Inventory tracking
  - Product recommendations
  - Recently viewed products
  - Image management

- ✅ **Shopping Experience**
  - Persistent shopping cart
  - Wishlist functionality
  - Product reviews and ratings
  - Real-time stock availability

- ✅ **Order Management**
  - Complete checkout process
  - Order tracking
  - Order history
  - Cancel/refund support
  - Invoice generation

- ✅ **Payment Integration**
  - Stripe payment processing
  - Webhook handling
  - Secure payment flow
  - Refund management

- ✅ **Admin Dashboard**
  - User management
  - Product management
  - Order management
  - Analytics and statistics

## 🏗️ Architecture

### Tech Stack

#### Backend
- **Framework**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache/Session**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Payment**: Stripe

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Payment UI**: Stripe Elements

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Process Manager**: PM2 (optional)

## 📁 Project Structure

```
ecommerce-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── auditLog.middleware.ts
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── order.service.ts
│   │   │   └── payment.service.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── encryption.ts
│   │   │   ├── jwt.ts
│   │   │   ├── email.ts
│   │   │   ├── logger.ts
│   │   │   └── validators.ts
│   │   ├── prisma/          # Prisma schema
│   │   └── server.ts        # Main server file
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (App Router)
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and configs
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Helper functions
│   ├── public/              # Static assets
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

## 🔒 Security Features

### Authentication Security
- ✅ **bcrypt** password hashing (cost factor 12)
- ✅ JWT with short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- ✅ HTTP-only secure cookies for token storage
- ✅ Token rotation on refresh
- ✅ Account lockout after failed login attempts
- ✅ Two-factor authentication (2FA) with TOTP
- ✅ Logout from all devices functionality

### API Security
- ✅ **Helmet.js** for security headers
- ✅ **Rate limiting** with Redis store (per IP and per user)
- ✅ **CORS** configuration with whitelisted origins
- ✅ **Request validation** with Zod
- ✅ **Input sanitization** to prevent XSS
- ✅ **Parameterized queries** to prevent SQL injection
- ✅ API versioning (v1)

### Data Protection
- ✅ **Encryption at rest** for sensitive data (AES-256-GCM)
- ✅ **TLS/SSL** for data in transit
- ✅ **Environment variables** for secrets
- ✅ **Audit logging** for critical operations

### Application Security
- ✅ **CSRF** protection
- ✅ **Content Security Policy** (CSP)
- ✅ **XSS** protection
- ✅ **Secure session management**
- ✅ **NoSQL injection prevention**
- ✅ **HPP** (HTTP Parameter Pollution) prevention
- ✅ Secure file upload validation

### Infrastructure Security
- ✅ **Docker** containerization with non-root users
- ✅ Health check endpoints
- ✅ **Winston** logging (no sensitive data in logs)
- ✅ Error handling without exposing stack traces in production

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Stripe account (for payments)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd e-com_app
```

#### 2. Environment Setup

**Backend:**

```bash
cd backend
cp .env.example .env
```

Edit `.env` and configure your environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecommerce?schema=public"

# JWT Secrets (MUST be changed in production!)
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-in-production-min-32-chars

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Frontend:**

```bash
cd frontend
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

#### 3. Using Docker (Recommended)

```bash
# From project root
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 5000
- Frontend on port 3000
- PgAdmin on port 5050 (optional)

#### 4. Manual Setup (Without Docker)

**Backend:**

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 🗄️ Database Setup

#### Run Migrations

```bash
cd backend
npx prisma migrate dev
```

#### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Access at http://localhost:5555

### 📚 API Documentation

Once the backend is running, access Swagger documentation at:

```
http://localhost:5000/api-docs
```

### 🧪 Testing

**Backend:**

```bash
cd backend
npm test
npm run test:coverage
```

**Frontend:**

```bash
cd frontend
npm test
```

## 📊 Database Schema

### Key Models

- **User**: Customer, Seller, Admin with RBAC
- **Product**: With variants, images, and inventory
- **Category**: Hierarchical categories
- **Cart**: Persistent shopping cart
- **Order**: Order management with status tracking
- **Payment**: Stripe integration
- **Review**: Product reviews and ratings
- **Wishlist**: User wishlists
- **Address**: Shipping and billing addresses
- **Session**: User sessions
- **AuditLog**: Security audit trail

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/2fa/setup` - Setup 2FA
- `POST /api/v1/auth/2fa/verify` - Verify 2FA
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin/Seller)
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/products/featured` - Get featured products

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add to cart
- `PATCH /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove from cart

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/webhook` - Stripe webhook
- `GET /api/v1/payments/order/:orderId` - Get payment

## 🎨 Frontend Features

### Pages
- Home page with featured products
- Product listing with filters
- Product detail page
- Shopping cart
- Checkout
- Order history
- User profile
- Admin dashboard

### Components
- Responsive navigation
- Product cards
- Shopping cart widget
- Search bar with autocomplete
- Authentication forms
- Payment forms (Stripe Elements)

## 🛠️ Development

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## 🚀 Deployment

### Production Build

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm start
```

### Security Checklist for Production

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up proper firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Enable audit logging
- [ ] Review and update security headers
- [ ] Set secure cookie flags
- [ ] Disable debug mode

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NODE_ENV | Environment mode | No | development |
| PORT | Server port | No | 5000 |
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| JWT_ACCESS_SECRET | JWT access token secret | Yes | - |
| JWT_REFRESH_SECRET | JWT refresh token secret | Yes | - |
| REDIS_URL | Redis connection string | Yes | - |
| STRIPE_SECRET_KEY | Stripe secret key | Yes | - |

See `.env.example` for full list.

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | Yes |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | Yes |

## 🐛 Troubleshooting

### Common Issues

**Database connection fails:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

**Redis connection fails:**
- Ensure Redis is running
- Check REDIS_URL in .env

**JWT errors:**
- Ensure JWT secrets are at least 32 characters
- Check token expiration settings

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

---

**Built with ❤️ using modern web technologies**
