// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const planRoutes = require('./routes/plan.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// Middleware - CORS
const FRONTEND_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

// CRITICAL: Raw body parser for Stripe webhooks MUST come BEFORE express.json()
// This ensures /api/webhook receives the raw request body for signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// JSON parsers for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'subscription_dashboard';

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not set in environment');
  process.exit(1);
}

const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${DB_NAME}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message || err);
    console.error('Full error:', err);
    process.exit(1);
  }
};

connectWithRetry();

// Routes - ORDER MATTERS!
// 1. Payment routes (includes webhook) - must be first for raw body
app.use('/api', paymentRoutes);

// 2. Auth routes
app.use('/api/auth', authRoutes);

// 3. Plan routes
app.use('/api/plans', planRoutes);

// 4. Subscription routes - FIXED: mount at /api/subscriptions
app.use('/api/subscriptions', subscriptionRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Subscription Dashboard API is live and running!');
});

// 404 Handler - must come before error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'GET    /api/auth/me',
      'PUT    /api/auth/me',
      'POST   /api/auth/logout',
      'GET    /api/plans',
      'GET    /api/subscriptions/me',
      'POST   /api/create-checkout-session',
      'POST   /api/webhook',
    ]
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Running directly (locally) -> start server
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${FRONTEND_ORIGIN}`);
    console.log(`📊 API Routes:`);
    console.log(`   - Auth:          /api/auth/*`);
    console.log(`   - Plans:         /api/plans/*`);
    console.log(`   - Subscriptions: /api/subscriptions/*`);
    console.log(`   - Payments:      /api/create-checkout-session`);
    console.log(`   - Webhook:       /api/webhook`);
  });

  const shutdown = () => {
    console.log('\n⏳ Shutting down server gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed.');
        console.log('👋 Server shutdown complete.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Imported by Vercel -> export handler
  module.exports = (req, res) => app(req, res);
}