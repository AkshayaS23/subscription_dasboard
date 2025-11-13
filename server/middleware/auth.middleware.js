// server/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Verify JWT Token
// @access  Used in protected routes
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Invalid token.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// @desc    Role-based authorization
// @usage   authorize('admin'), authorize('user', 'admin')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// @desc    Check if user has active subscription
// @access  Used in routes that require subscription
// @critical SKIPS CHECK FOR ADMIN USERS (Issue #1 fix!)
exports.checkSubscription = async (req, res, next) => {
  try {
    // CRITICAL: Skip subscription check for admin users
    if (req.user && req.user.role === 'admin') {
      console.log(`✅ Admin user ${req.user.email} bypassing subscription check`);
      return next();
    }

    const Subscription = require('../models/Subscription');
    
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this resource',
        requiresSubscription: true
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('❌ Subscription check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Subscription verification failed',
      error: error.message
    });
  }
};

// Alias for backwards compatibility (if you use 'protect' anywhere)
exports.protect = exports.authenticate;