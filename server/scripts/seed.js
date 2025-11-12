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
    priceId: 'price_starter_test',
    slug: 'starter',
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
    priceId: 'price_professional_test',
    slug: 'professional',
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
    priceId: 'price_enterprise_test',
    slug: 'enterprise',
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
    priceId: 'price_annual_pro_test',
    slug: 'annual-pro',
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription_dashboard';
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'subscription_dashboard',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // --- PLANS: upsert so script is idempotent ---
    for (const p of plans) {
      const existing = await Plan.findOne({ name: p.name });
      if (existing) {
        await Plan.updateOne({ _id: existing._id }, { $set: p });
        console.log(`🔁 Updated plan: ${p.name}`);
      } else {
        await Plan.create(p);
        console.log(`➕ Created plan: ${p.name}`);
      }
    }

    // --- USERS: create test/admin if not exist (do NOT delete users in production) ---
    const adminEmail = 'admin@test.com';
    const testEmail = 'user@test.com';

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123',
        role: 'admin'
      });
      console.log(`➕ Admin user created: ${adminEmail} / admin123`);
    } else {
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
    }

    const userExists = await User.findOne({ email: testEmail });
    if (!userExists) {
      await User.create({
        name: 'Test User',
        email: testEmail,
        password: 'user123',
        role: 'user'
      });
      console.log(`➕ Test user created: ${testEmail} / user123`);
    } else {
      console.log(`ℹ️ Test user already exists: ${testEmail}`);
    }

    console.log('\n🎉 Database seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
