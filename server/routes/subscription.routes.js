// server/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// User routes
router.post(
  '/subscribe/:planId',
  authenticate,
  subscriptionController.subscribe
);

router.get(
  '/my-subscription',
  authenticate,
  subscriptionController.getMySubscription
);

router.put(
  '/subscription/cancel',
  authenticate,
  subscriptionController.cancelSubscription
);

router.put(
  '/subscription/upgrade',
  authenticate,
  subscriptionController.upgradeSubscription
);

// Admin routes
router.get(
  '/admin/subscriptions',
  authenticate,
  authorize('admin'),
  subscriptionController.getAllSubscriptions
);

module.exports = router;