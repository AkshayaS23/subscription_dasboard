// server/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Virtual to check if subscription is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date();
});

// Update status to expired if end date has passed
subscriptionSchema.pre('find', function() {
  this.where({ endDate: { $gte: new Date() } });
});

subscriptionSchema.methods.toJSON = function() {
  const subscription = this.toObject({ virtuals: true });
  delete subscription.__v;
  return subscription;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);