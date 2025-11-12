// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const planRoutes = require('./routes/plan.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const paymentRoutes = require('./routes/payment.routes'); // <-- payment routes (webhook + payment endpoints)

const app = express();

// Middleware
const FRONTEND_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));


// IMPORTANT: raw body parser for Stripe webhooks must be mounted BEFORE express.json()
// This ensures the /api/webhook route receives the raw request body required for signature verification.
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// JSON parsers for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection (robust)
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'subscription_dashboard';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in environment');
  process.exit(1);
}

const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30s
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message || err);
    console.error('Full error:', err);
    process.exit(1); // or retry if you prefer
  }
};

connectWithRetry();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api', subscriptionRoutes);

// Mount payment routes (these include create-checkout-session and payment-success).
// Note: webhook route path is /api/webhook and will use the raw body parser we mounted earlier.
app.use('/api', paymentRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Server is live and running on Vercel!');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});


const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Running directly (locally) -> start server
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Imported by Vercel -> export a handler function
  // Vercel expects `module.exports = (req, res) => { ... }`
  module.exports = (req, res) => app(req, res);
}

