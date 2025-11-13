// server/controllers/user.controller.js
const User = require('../models/User');

/**
 * GET /api/users
 * Admin-only: return list of users (with safe fields)
 * Supports optional query params: ?page=1&limit=50 (simple pagination)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // pagination defaults
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const [users, count] = await Promise.all([
      User.find()
        .select('-password -refreshToken -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      count,
      page,
      limit,
      data: users
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: err.message
    });
  }
};
