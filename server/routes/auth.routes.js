// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { 
  registerValidation, 
  loginValidation, 
  handleValidationErrors 
} = require('../middleware/validation.middleware');

// Public routes
router.post(
  '/register', 
  registerValidation, 
  handleValidationErrors, 
  authController.register
);

router.post(
  '/login', 
  loginValidation, 
  handleValidationErrors, 
  authController.login
);

router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;