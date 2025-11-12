// server/controllers/auth.controller.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Read env vars (with safe fallbacks for local dev)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

// Warn if secrets are missing (helpful in Vercel logs)
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️ JWT_SECRET or JWT_REFRESH_SECRET not set in environment. Using fallback values — set env vars in production.');
}

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE
  });

  return { accessToken, refreshToken };
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token on user
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Register failed:', error && error.stack ? error.stack : error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message || String(error)
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user with password field (select +password if it is excluded by default)
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      // do not reveal which one was wrong for security
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Defensive: ensure comparePassword exists
    let isPasswordValid = false;
    if (typeof user.comparePassword === 'function') {
      try {
        isPasswordValid = await user.comparePassword(password);
      } catch (cmpErr) {
        console.error('⚠️ comparePassword threw an error:', cmpErr && (cmpErr.stack || cmpErr));
        return res.status(500).json({ success: false, message: 'Server error during password verification' });
      }
    } else {
      console.error('⚠️ User.comparePassword is not defined on the User model.');
      return res.status(500).json({ success: false, message: 'Server misconfiguration: password compare missing' });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    // Do not persist password field changes, but ensure save only updates refreshToken
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    // Strong logging so Vercel shows full stack
    console.error('❌ Login failed:', error && error.stack ? error.stack : error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message || String(error)
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (verifyErr) {
      console.warn('⚠️ Refresh token verify failed:', verifyErr && (verifyErr.stack || verifyErr));
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Find user and ensure refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Update refresh token on user and persist
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('❌ Refresh token failed:', error && error.stack ? error.stack : error);
    return res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message || String(error)
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // ensure req.user is present (authenticate middleware should set it)
    if (!req.user || !req.user.id) {
      return res.status(400).json({ success: false, message: 'User context missing' });
    }

    const user = await User.findById(req.user.id).select('+refreshToken');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.refreshToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout failed:', error && error.stack ? error.stack : error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message || String(error)
    });
  }
};
