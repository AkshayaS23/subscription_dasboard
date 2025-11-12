// server/controllers/subscription.controller.js
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// Subscribe to a plan
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
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

// Get user's current subscription (updated to return 200 + consistent shape)
exports.getMySubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .populate('plan', 'name price duration features')
    .sort({ createdAt: -1 });

    // Always return 200 and a consistent response shape
    return res.status(200).json({
      success: true,
      subscription: sub || null
    });
  } catch (error) {
    console.error('getMySubscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
};


// Get all subscriptions (Admin only)
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
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
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

// Upgrade subscription
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
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription',
      error: error.message
    });
  }
};