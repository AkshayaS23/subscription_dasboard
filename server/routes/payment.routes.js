// server/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create checkout session
router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

// Handle payment success (client redirects here after checkout)
router.get('/payment-success', authenticate, paymentController.handlePaymentSuccess);

// Webhook endpoint — expect raw body, route will be mounted with raw middleware
router.post('/webhook', paymentController.stripeWebhook);

module.exports = router;
