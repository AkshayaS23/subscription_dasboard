// server/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// User routes - MUST come before admin routes to avoid path conflicts

// Get current user's subscription (CRITICAL: Frontend calls /api/subscriptions/me)
router.get(
  '/me',
  authenticate,
  subscriptionController.getMySubscription
);

// Subscribe to a plan
router.post(
  '/subscribe/:planId',
  authenticate,
  subscriptionController.subscribe
);

// Cancel subscription
router.post(
  '/cancel',
  authenticate,
  subscriptionController.cancelSubscription
);

// Upgrade subscription
router.post(
  '/upgrade',
  authenticate,
  subscriptionController.upgradeSubscription
);

// Admin routes - These should come AFTER user routes

// Get all subscriptions (Admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  subscriptionController.getAllSubscriptions
);

// Create subscription (Admin/Webhook use)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  subscriptionController.createSubscription
);

// Update subscription (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  subscriptionController.updateSubscription
);

// Cancel/Delete subscription (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  subscriptionController.cancelSubscription
);

module.exports = router;