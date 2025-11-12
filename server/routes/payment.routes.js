// server/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create checkout session (authenticated)
router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

// Handle payment success (client redirects here after checkout) — NO authenticate
router.get('/payment-success', paymentController.handlePaymentSuccess);

// Webhook endpoint — keep it here for clarity but ensure server.js mounts raw at /api/webhook
router.post('/webhook', paymentController.stripeWebhook);

module.exports = router;
