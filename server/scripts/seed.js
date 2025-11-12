// server/scripts/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('../models/Plan');
const User = require('../models/User');

dotenv.config();

const plans = [
  {
    name: 'Starter',
    price: 9.99,
    duration: 30,
    features: [
      '5 Projects',
      'Basic Support',
      '10GB Storage',
      'Email Reports',
      'Community Access'
    ],
    isActive: true
  },
  {
    name: 'Professional',
    price: 29.99,
    duration: 30,
    features: [
      'Unlimited Projects',
      'Priority Support',
      '100GB Storage',
      'Advanced Analytics',
      'Custom Domain',
      'API Access',
      'Team Collaboration'
    ],
    isActive: true
  },
  {
    name: 'Enterprise',
    price: 99.99,
    duration: 30,
    features: [
      'Unlimited Everything',
      '24/7 Dedicated Support',
      'Unlimited Storage',
      'White Label',
      'Advanced API Access',
      'Custom Integrations',
      'Priority Feature Requests',
      'Dedicated Account Manager',
      'SLA Guarantee'
    ],
    isActive: true
  },
  {
    name: 'Annual Pro',
    price: 299.99,
    duration: 365,
    features: [
      'All Professional Features',
      'Annual Billing (Save 20%)',
      '200GB Storage',
      'Premium Templates',
      'Advanced Security'
    ],
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription_dashboard', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Plan.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert plans
    const createdPlans = await Plan.insertMany(plans);
    console.log(`✅ ${createdPlans.length} plans seeded successfully`);

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin user created (email: admin@test.com, password: admin123)');

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'user123',
      role: 'user'
    });
    console.log('✅ Test user created (email: user@test.com, password: user123)');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@test.com / admin123');
    console.log('User: user@test.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();