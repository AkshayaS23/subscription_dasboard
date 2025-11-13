// server/routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin-only endpoint
router.get('/users', authenticate, authorize('admin'), usersController.getAllUsers);

module.exports = router;
