// server/controllers/payment.controller.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id; // set by auth middleware

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const existing = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });
    if (existing) return res.status(400).json({ success: false, message: 'You already have an active subscription' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name, description: `${plan.duration} days subscription` },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: `${process.env.CLIENT_URL}/plans?cancelled=true`,
      client_reference_id: userId,
      metadata: { userId, planId, planName: plan.name }
    });

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session', error: error.message });
  }
};

exports.handlePaymentSuccess = async (req, res) => {
  try {
    const session_id = req.query.session_id;
    const plan_id = req.query.plan_id;
    const userId = req.user.id;

    if (!session_id || !plan_id) return res.status(400).json({ success: false, message: 'Missing params' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const plan = await Plan.findById(plan_id);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscription = await Subscription.create({
        user: userId,
        plan: plan_id,
        startDate,
        endDate,
        status: 'active',
        paymentId: session.payment_intent,
        amount: plan.price
      });

      await subscription.populate('plan', 'name price duration features');

      return res.status(200).json({ success: true, message: 'Subscription activated successfully', data: subscription });
    }

    res.status(400).json({ success: false, message: 'Payment not completed' });
  } catch (error) {
    console.error('Payment success error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment', error: error.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, planId } = session.metadata;
        const plan = await Plan.findById(planId);
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration);

        await Subscription.create({
          user: userId,
          plan: planId,
          startDate,
          endDate,
          status: 'active',
          paymentId: session.payment_intent,
          amount: plan.price
        });
        console.log('Subscription created via webhook for user:', userId);
        break;
      }
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
};
