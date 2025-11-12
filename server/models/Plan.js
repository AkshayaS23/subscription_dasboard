// server/models/Plan.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  features: {
    type: [String],
    required: [true, 'Features are required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one feature is required'
    }
  },
  // new: priceId for Stripe or client-side price code
  priceId: {
    type: String,
    trim: true,
    index: true,
    default: null
  },
  // optional slug (nice-to-have)
  slug: {
    type: String,
    trim: true,
    index: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
