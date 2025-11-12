// server/controllers/payment.controller.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const mongoose = require('mongoose');

/**
 * Helper: check if a value is a valid Mongo ObjectId
 */
function isObjectId(value) {
  try {
    return mongoose.Types.ObjectId.isValid(String(value));
  } catch (e) {
    return false;
  }
}

/**
 * Create a Stripe Checkout session for a plan
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { planId, priceId } = req.body;
    // Prefer authenticated user id from middleware, but allow client to pass userId if needed
    const userId = (req.user && req.user.id) || req.body.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user required' });
    }

    // Resolve plan robustly: try _id (ObjectId), then priceId, then slug/code fields
    let plan = null;

    if (planId && isObjectId(planId)) {
      plan = await Plan.findById(planId);
    }

    if (!plan && priceId) {
      plan = await Plan.findOne({ priceId });
    }

    if (!plan && planId && typeof planId === 'string') {
      plan = await Plan.findOne({
        $or: [
          { priceId: planId },
          { slug: planId },
          { code: planId }
        ]
      });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Prevent creating session if user already has an active subscription
    const existing = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active subscription' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name, description: `${plan.duration} days subscription` },
          unit_amount: Math.round((plan.price || 0) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan_id=${plan._id}`,
      cancel_url: `${process.env.CLIENT_URL}/plans?cancelled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        planId: plan._id.toString(),
        planName: plan.name,
        priceId: plan.priceId || ''
      }
    });

    return res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', error: error.message });
  }
};

exports.handlePaymentSuccess = async (req, res) => {
  try {
    const session_id = req.query.session_id;
    const plan_id = req.query.plan_id;

    if (!session_id || !plan_id) {
      return res.status(400).json({ success: false, message: 'Missing params' });
    }

    // Retrieve session from Stripe to verify status and get client_reference_id
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Identify user from session (client_reference_id or metadata.userId)
    const userId = session.client_reference_id || (session.metadata && session.metadata.userId);

    // For UX only: return session & metadata to frontend. Do NOT rely on this to create subscription.
    // The webhook (checkout.session.completed) should create the subscription server-side.
    return res.status(200).json({
      success: true,
      message: 'Checkout session retrieved',
      session: {
        id: session.id,
        payment_status: session.payment_status,
        client_reference_id: userId,
        metadata: session.metadata,
      }
    });
  } catch (error) {
    console.error('Payment success error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payment', error: error.message });
  }
};


/**
 * Stripe webhook handler (expects raw body, mounted with express.raw in server)
 */
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId } = session.metadata || {};

        if (!userId || !planId) {
          console.error('⚠️ Missing metadata in checkout session', { metadata: session.metadata });
          break;
        }

        // Resolve plan
        let plan = null;
        if (isObjectId(planId)) plan = await Plan.findById(planId);
        if (!plan) plan = await Plan.findOne({ $or: [{ priceId: planId }, { slug: planId }, { code: planId }] });

        if (!plan) {
          console.error('⚠️ Plan not found for webhook planId:', planId);
          break;
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (plan.duration || 30));

        const existing = await Subscription.findOne({
          user: userId,
          plan: plan._id,
          status: 'active',
          endDate: { $gte: new Date() }
        });

        if (existing) {
          console.log(`⚠️ Subscription already active for user ${userId}`);
        } else {
          await Subscription.create({
            user: userId,
            plan: plan._id,
            startDate,
            endDate,
            status: 'active',
            paymentId: session.payment_intent,
            amount: plan.price,
          });
          console.log('✅ Subscription created via webhook for user:', userId);
        }

        break;
      }

      case 'invoice.payment_succeeded':
        console.log('✅ Invoice paid:', event.data.object.id);
        break;

      case 'payment_intent.succeeded':
        console.log('💰 Payment succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Always respond OK to Stripe
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('🚨 Webhook handler error:', err);
    return res.status(500).send('Webhook handler error');
  }
};
