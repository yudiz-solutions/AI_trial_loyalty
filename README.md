# AI Trial Loyalty Rewards System

A comprehensive Node.js + MongoDB loyalty rewards management system with multi-role authentication and advanced features.

## 🚀 Features

### Multi-Role System
- **Admin**: Manage merchants, branches, customers, and transactions
- **Merchant**: Manage workers, branches, customers, and view analytics
- **Worker**: Handle customer transactions (top-up/redeem points)

### Core Functionality
- **Authentication**: JWT-based auth with role-based access control
- **Merchant Management**: Registration, approval workflow, settings
- **Branch Management**: Multi-location support with worker assignments
- **Customer Management**: Loyalty card system with QR codes
- **Transaction System**: Points-based rewards with cash equivalents
- **Settings**: Configurable point rates, limits, and commissions

### Security & Best Practices
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and CORS protection
- Comprehensive error handling
- Request/response logging
- MongoDB injection protection

## 📋 API Endpoints

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register-merchant
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
PUT  /api/v1/auth/update-password
POST /api/v1/auth/logout
```

### Admin Routes
```
GET    /api/v1/admin/merchants
GET    /api/v1/admin/merchants/:id
POST   /api/v1/admin/merchants/:id/approve
POST   /api/v1/admin/merchants/:id/reject
PUT    /api/v1/admin/merchants/:id
DELETE /api/v1/admin/merchants/:id

GET   /api/v1/admin/branches
PATCH /api/v1/admin/branches/:id/status

GET   /api/v1/admin/customers
GET   /api/v1/admin/customers/:id
PATCH /api/v1/admin/customers/:id/status

GET   /api/v1/admin/transactions
PATCH /api/v1/admin/transactions/:id/pay-status
```

### Merchant Routes
```
GET    /api/v1/merchant/workers
POST   /api/v1/merchant/workers
GET    /api/v1/merchant/workers/:id
PUT    /api/v1/merchant/workers/:id
DELETE /api/v1/merchant/workers/:id

GET    /api/v1/merchant/branches
POST   /api/v1/merchant/branches
PUT    /api/v1/merchant/branches/:id
DELETE /api/v1/merchant/branches/:id

GET   /api/v1/merchant/customers
GET   /api/v1/merchant/customers/:id
PATCH /api/v1/merchant/customers/:id/status

GET /api/v1/merchant/transactions
GET /api/v1/merchant/transactions/:id

GET /api/v1/merchant/settings/points
PUT /api/v1/merchant/settings/points
```

### Worker Routes
```
GET  /api/v1/worker/customers
GET  /api/v1/worker/customers/:id
POST /api/v1/worker/customers/:id/topup
POST /api/v1/worker/customers/:id/redeem
GET  /api/v1/worker/customers/:id/transactions
```

## 🗄️ Database Schema

### Collections
- `admins` - System administrators
- `merchants` - Business owners
- `workers` - Branch employees
- `branches` - Business locations
- `customers` - Loyalty program members
- `transactions` - Points transactions
- `merchantsettings` - Merchant configurations
- `passwordresettokens` - Password reset tokens
- `files` - Uploaded file references

### Key Relationships
- Merchant → Many Branches
- Merchant → Many Workers
- Branch → One Assigned Worker
- Customer → Belongs to Merchant & Branch
- Transaction → References Customer, Merchant, Branch, Worker

## 🛠️ Installation & Setup

1. **Clone and Install**
```bash
git clone <repository>
cd ai_trial_loyalty
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Production**
```bash
npm start
```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai_trial_loyalty

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 📝 Usage Examples

### Login as Different Roles
```javascript
// Admin Login
POST /api/v1/auth/login
{
  "sEmail": "admin@example.com",
  "sPassword": "password123",
  "sRole": "admin"
}

// Merchant Login
POST /api/v1/auth/login
{
  "sEmail": "merchant@example.com",
  "sPassword": "password123",
  "sRole": "merchant"
}

// Worker Login
POST /api/v1/auth/login
{
  "sEmail": "worker@example.com",
  "sPassword": "password123",
  "sRole": "worker"
}
```

### Customer Transaction (Worker)
```javascript
// Top-up Customer Points
POST /api/v1/worker/customers/:customerId/topup
{
  "nPoints": 100,
  "nCashEquivalentValue": 10.00
}

// Redeem Customer Points
POST /api/v1/worker/customers/:customerId/redeem
{
  "nPoints": 50,
  "nCashEquivalentValue": 5.00
}
```

## 🏗️ Architecture

### Project Structure
```
src/
├── controllers/     # Request handlers
├── models/         # MongoDB schemas
├── routes/         # API route definitions
├── middlewares/    # Custom middleware
├── utils/          # Utility functions
└── config/         # Configuration files
```

### Key Design Patterns
- **MVC Architecture**: Clear separation of concerns
- **Middleware Pattern**: Reusable request processing
- **Repository Pattern**: Data access abstraction
- **Factory Pattern**: Model selection based on user role

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: express-validator integration
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configurable origins
- **NoSQL Injection Prevention**: Input sanitization

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with levels
- **Request Logging**: Automatic request/response tracking
- **Error Tracking**: Centralized error handling
- **Health Checks**: System status endpoints

## 🚀 Deployment Ready

- **Production Error Handling**: No stack traces in production
- **Environment Configuration**: Flexible config management
- **Process Management**: Graceful shutdown handling
- **Database Connection**: Automatic reconnection logic

## 📈 Scalability Features

- **Pagination**: Built-in pagination for all list endpoints
- **Filtering**: Query-based filtering and search
- **Indexing**: Optimized database indexes
- **Lean Queries**: Memory-efficient data retrieval

This system provides a complete foundation for building loyalty rewards applications with enterprise-grade features and security.