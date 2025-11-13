# 🚀 Subscription Management Dashboard

A full-stack SaaS subscription management platform built with React, Node.js, Express, and MongoDB.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)

## ✨ Features

### User Features
- 🔐 Secure authentication with JWT (access & refresh tokens)
- 👤 User registration and login
- 📊 Personal dashboard with profile information
- 💳 Browse and subscribe to plans
- 📈 View current subscription status
- 🔄 Upgrade/downgrade subscriptions
- ❌ Cancel subscriptions

### Admin Features
- 👨‍💼 Admin dashboard
- 📋 View all subscriptions
- ➕ Create, update, and delete plans
- 📊 Monitor subscription statistics

### General Features
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design
- 🔒 Role-based access control
- ✅ Input validation
- ⚡ Fast and efficient API
- 🎨 Modern UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Router DOM** - Routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
subscription-dashboard-task/
├── client/                      # Frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── store/              # Zustand store
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                      # Backend application
│   ├── controllers/            # Route controllers
│   │   ├── auth.controller.js
│   │   ├── plan.controller.js
│   │   └── subscription.controller.js
│   ├── middleware/             # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Plan.js
│   │   └── Subscription.js
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── plan.routes.js
│   │   └── subscription.routes.js
│   ├── scripts/                # Utility scripts
│   │   └── seed.js
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🔧 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd subscription-dashboard-task
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Create environment file**
```bash
cd server
cp .env.example .env
```

2. **Update .env file**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/subscription_dashboard
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration

Create `client/src/config/api.config.js`:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## 🚀 Running the Project

### Start MongoDB
```bash
# If using local MongoDB
mongod
```

### Seed the Database
```bash
cd server
npm run seed
```

This will create:
- 4 sample plans (Starter, Professional, Enterprise, Annual Pro)
- Admin user: `admin@test.com` / `admin123`
- Test user: `user@test.com` / `user123`

### Start Backend Server
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:5000`

### Start Frontend
```bash
cd client
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Plans
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/plans` | Get all plans | No | - |
| GET | `/api/plans/:id` | Get single plan | No | - |
| POST | `/api/plans` | Create plan | Yes | Admin |
| PUT | `/api/plans/:id` | Update plan | Yes | Admin |
| DELETE | `/api/plans/:id` | Delete plan | Yes | Admin |

### Subscriptions
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/subscribe/:planId` | Subscribe to plan | Yes | User |
| GET | `/api/my-subscription` | Get user's subscription | Yes | User |
| PUT | `/api/subscription/cancel` | Cancel subscription | Yes | User |
| PUT | `/api/subscription/upgrade` | Upgrade subscription | Yes | User |
| GET | `/api/admin/subscriptions` | Get all subscriptions | Yes | Admin |

## 🧪 Testing

### Test Credentials

**Admin Account:**
- Email: `admin@gmail.com`
- Password: `adminpass`

**User Account:**
- Email: `user@gmail.com`
- Password: `Userpass1`

### API Testing with cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Plans:**
```bash
curl http://localhost:5000/api/plans
```

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=your-backend-url`
6. Deploy

### Environment Variables for Production

**Backend:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=strong-random-secret
JWT_REFRESH_SECRET=another-strong-secret
CLIENT_URL=your-frontend-url
```

**Frontend:**
```env
VITE_API_URL=your-backend-api-url
```

## 📝 Features Checklist

### Core Requirements
- ✅ JWT Authentication with access & refresh tokens
- ✅ Role-based access control (admin, user)
- ✅ User registration and login
- ✅ Plan management (CRUD operations)
- ✅ Subscription management
- ✅ Input validation (Express Validator)
- ✅ Error handling
- ✅ MongoDB with Mongoose
- ✅ Database seeding
- ✅ Responsive UI with Tailwind CSS
- ✅ State management (Zustand)
- ✅ Protected routes

### Bonus Features
- ✅ Dark/Light theme toggle
- ✅ Plan upgrade/downgrade logic
- 🔄 Payment integration (Stripe/Razorpay) - Ready for implementation
  
## 🚀 Live Demo

You can view the live deployed version of the Subscription Dashboard here:

🔗 **Live Site:** https://subscription-dasboard-client.vercel.app/

## 👨‍💻 Author

**Your Name**
- Email: akshayaviswanathan8@gmail.com
- GitHub: https://github.com/AkshayaS23
- LinkedIn: https://www.linkedin.com/in/akshaya-v-160b442a1/



## 🙏 Acknowledgments

- GNXTACE TECHNOLOGIES for the technical assessment
- React, Node.js, and MongoDB communities
- All open-source contributors

---

**Note:** This project was created as part of a technical assessment for a Full Stack Web Developer position.
