// server/controllers/subscription.controller.js
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/me
exports.getMySubscription = async (req, res) => {
  try {
    // CRITICAL: If user is admin, return null (admins don't need subscriptions)
    if (req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        message: 'Admin users do not require subscriptions',
        subscription: null
      });
    }

    const sub = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).populate('plan', 'name price duration features');

    if (!sub) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active subscription found',
        subscription: null 
      });
    }

    const subscription = {
      id: sub._id,
      planId: sub.plan._id,
      planName: sub.plan.name,
      endDate: sub.endDate,
      status: sub.status,
      duration: sub.plan.duration,
      price: sub.plan.price,
      plan: sub.plan // Include full plan object for compatibility
    };

    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error('❌ Get subscription failed:', error && error.stack ? error.stack : error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscription',
      error: error.message 
    });
  }
};

// @desc    Subscribe to a plan
// @route   POST /api/subscriptions/:planId
exports.subscribe = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user.id;

    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or inactive'
      });
    }

    // Check for active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create subscription
    const subscription = await Subscription.create({
      user: userId,
      plan: planId,
      startDate,
      endDate,
      status: 'active'
    });

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('plan', 'name price duration features')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: populatedSubscription
    });
  } catch (error) {
    console.error('❌ Subscribe failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email role')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Subscription.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: subscriptions
    });
  } catch (error) {
    console.error('❌ Get all subscriptions failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};

// @desc    Create subscription (Admin/Webhook use)
// @route   POST /api/subscriptions
exports.createSubscription = async (req, res) => {
  try {
    const { userId, planId, stripeSessionId } = req.body;

    // Validate input
    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Plan ID are required'
      });
    }

    // Check if user already has an active subscription
    const existingSub = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSub) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create subscription
    const subscription = await Subscription.create({
      user: userId,
      plan: planId,
      status: 'active',
      startDate,
      endDate,
      stripeSessionId
    });

    const populatedSub = await Subscription.findById(subscription._id)
      .populate('plan')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: populatedSub
    });
  } catch (error) {
    console.error('❌ Create subscription failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

// @desc    Update subscription (Admin only)
// @route   PUT /api/subscriptions/:id
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('plan').populate('user', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Update subscription failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

// @desc    Cancel subscription
// @route   DELETE /api/subscriptions/:id or POST /api/subscriptions/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    
    // If no ID in params, find user's active subscription
    let subscription;
    if (subscriptionId) {
      subscription = await Subscription.findById(subscriptionId);
    } else {
      subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'active'
      });
    }

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Ensure user owns this subscription (unless admin)
    if (req.user.role !== 'admin' && subscription.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this subscription'
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('❌ Cancel subscription failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

// @desc    Upgrade subscription
// @route   POST /api/subscriptions/upgrade
exports.upgradeSubscription = async (req, res) => {
  try {
    const { newPlanId } = req.body;
    const userId = req.user.id;

    // Get current subscription
    const currentSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get new plan
    const newPlan = await Plan.findById(newPlanId);
    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or inactive'
      });
    }

    // Cancel current subscription
    currentSubscription.status = 'cancelled';
    await currentSubscription.save();

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + newPlan.duration);

    const newSubscription = await Subscription.create({
      user: userId,
      plan: newPlanId,
      startDate,
      endDate,
      status: 'active'
    });

    const populatedSubscription = await Subscription.findById(newSubscription._id)
      .populate('plan', 'name price duration features')
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: populatedSubscription
    });
  } catch (error) {
    console.error('❌ Upgrade subscription failed:', error && error.stack ? error.stack : error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription',
      error: error.message
    });
  }
};