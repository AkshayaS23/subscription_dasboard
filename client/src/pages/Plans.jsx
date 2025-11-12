// client/src/pages/Plans.jsx
import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE');

export default function Plans({ darkMode, subscription, user: propUser }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // fallback mock plans
  const mockPlans = [
    { id: '1', name: 'Starter', price: 9.99, priceId: 'price_starter_test', duration: 30, features: ['5 Projects', 'Basic Support', '10GB Storage', 'Email Reports'] },
    { id: '2', name: 'Professional', price: 29.99, priceId: 'price_professional_test', duration: 30, features: ['Unlimited Projects', 'Priority Support', '100GB Storage', 'Advanced Analytics', 'Custom Domain'] },
    { id: '3', name: 'Enterprise', price: 99.99, priceId: 'price_enterprise_test', duration: 30, features: ['Unlimited Everything', '24/7 Dedicated Support', 'Unlimited Storage', 'White Label', 'API Access', 'Custom Integrations'] },
  ];

  useEffect(() => {
    if (subscription?.planId) setSelectedPlan(subscription.planId);
  }, [subscription]);

  // Resolve the current user: prefer prop, else try localStorage
  const getCurrentUser = () => {
    if (propUser) return propUser;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const handleSubscribe = async (plan) => {
    if (loading) return;

    const userNow = getCurrentUser();
    if (!userNow) {
      alert('Please login to subscribe');
      navigate('/login');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '';
      const url = API_ROOT ? `${API_ROOT}/api/create-checkout-session` : `/api/create-checkout-session`;

      const token = localStorage.getItem('accessToken');

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId: plan.id, priceId: plan.priceId, userId: userNow.id })
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Server responded ${resp.status}: ${text || resp.statusText}`);
      }

      const session = await resp.json();

      // Expectation: backend should return { url: session.url, success: true }
      if (session.url) {
        // Recommended: redirect browser to the Checkout URL returned by Stripe
        window.location.href = session.url;
        return;
      }

      // Fallback (not recommended): if backend returns sessionId, try legacy redirect
      if (session.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to initialize.');
        // NOTE: this may be unsupported in some stripe.js versions
        const { error } = await stripe.redirectToCheckout({ sessionId: session.sessionId });
        if (error) throw error;
        return;
      }

      throw new Error(session.message || 'No checkout URL returned from server.');
    } catch (err) {
      console.error('Subscription error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className={`text-4xl font-bold ${textClass} mb-4`}>Choose Your Plan</h2>
        <p className={textSecondary}>Select the perfect plan for your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {mockPlans.map((plan, index) => {
          const isActive = selectedPlan === plan.id;
          const isCurrentPlan = subscription?.planId === plan.id;

          return (
            <div key={plan.id} className={`${cardBg} rounded-2xl shadow-xl p-8 transition-all duration-200 ${isActive ? 'border-4 border-indigo-500 scale-105' : 'border border-transparent'}`}>
              {index === 1 && <div className="bg-indigo-500 text-white text-sm font-bold px-4 py-1 rounded-full inline-block mb-4">POPULAR</div>}

              <h3 className={`text-2xl font-bold ${textClass} mb-2`}>{plan.name}</h3>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${textClass}`}>${plan.price}</span>
                <span className={textSecondary}>/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className={textSecondary}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading || isCurrentPlan}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isCurrentPlan ? 'bg-green-500 text-white cursor-not-allowed' : (loading && isActive ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                }`}
              >
                {loading && isActive ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></> : isCurrentPlan ? <span>Current Plan</span> : <span>Subscribe Now</span>}
              </button>
            </div>
          );
        })}
      </div>

      <div className={`mt-12 p-6 ${cardBg} rounded-lg shadow-lg max-w-2xl mx-auto`}>
        <h3 className={`text-lg font-bold ${textClass} mb-4`}>🧪 Test Payment Information</h3>
        <div className={`space-y-2 ${textSecondary} text-sm`}>
          <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
          <p><strong>Expiry:</strong> Any future date (e.g., 12/34)</p>
          <p><strong>CVC:</strong> Any 3 digits (e.g., 123)</p>
          <p><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</p>
        </div>
      </div>
    </div>
  );
}
