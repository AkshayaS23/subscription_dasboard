// server/routes/plan.routes.js
const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { planValidation, handleValidationErrors } = require('../middleware/validation.middleware');

// Public route - Get all plans
router.get('/', planController.getAllPlans);

// Public route - Get single plan
router.get('/:id', planController.getPlan);

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize('admin'),
  planValidation,
  handleValidationErrors,
  planController.createPlan
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  planValidation,
  handleValidationErrors,
  planController.updatePlan
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  planController.deletePlan
);

module.exports = router;