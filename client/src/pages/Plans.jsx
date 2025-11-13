// client/src/pages/Plans.jsx
import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import { planAPI } from '../services/api';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Fallback mock plans (kept for offline / dev)
const fallbackMockPlans = [
  { id: '1', name: 'Starter', price: 9.99, priceId: 'price_starter_test', duration: 30, features: ['5 Projects', 'Basic Support', '10GB Storage', 'Email Reports'] },
  { id: '2', name: 'Professional', price: 29.99, priceId: 'price_professional_test', duration: 30, features: ['Unlimited Projects', 'Priority Support', '100GB Storage', 'Advanced Analytics', 'Custom Domain'] },
  { id: '3', name: 'Enterprise', price: 99.99, priceId: 'price_enterprise_test', duration: 30, features: ['Unlimited Everything', '24/7 Dedicated Support', 'Unlimited Storage', 'White Label', 'API Access', 'Custom Integrations'] },
];

export default function Plans({ darkMode, subscription: propSubscription, user: propUser }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(fallbackMockPlans);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localSubscription, setLocalSubscription] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Helper to normalize plan id from various shapes
  const getPlanId = (p) => p && (p._id || p.id || p.uuid || p.planId || p.priceId || p.id);

  // Helper to normalize subscription object and extract plan id
  const extractPlanId = (sub) => {
    if (!sub) return null;
    if (sub.planId) return String(sub.planId);
    if (sub.plan && (sub.plan._id || sub.plan.id)) return String(sub.plan._id || sub.plan.id);
    if (typeof sub.plan === 'string') return String(sub.plan);
    if (sub.data && sub.data.planId) return String(sub.data.planId);
    return null;
  };

  // try to resolve current user
  const getCurrentUser = () => {
    if (propUser) return propUser;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  };

  // Load plans from backend (fallback to mockPlans)
  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await planAPI.getAll();
      const data = res?.data?.data || res?.data || [];
      // normalize to expected shape: ensure id/_id/priceId present
      if (Array.isArray(data) && data.length) {
        setPlans(data.map((p) => ({
          id: p._id || p.id || String(Math.random()),
          _id: p._id || p.id || undefined,
          name: p.name,
          price: p.price,
          priceId: p.priceId || p.stripePriceId || '',
          duration: p.duration || 30,
          features: p.features || []
        })));
      } else {
        // fallback to existing array if no data
        setPlans(fallbackMockPlans);
      }
    } catch (err) {
      // keep fallback if request fails
      console.warn('Failed to load plans from API, using fallback mocks', err);
      setPlans(fallbackMockPlans);
    } finally {
      setLoadingPlans(false);
    }
  };

  // On mount: load plans and subscription
  useEffect(() => {
    loadPlans();

    // Load subscription from prop or localStorage
    if (propSubscription) {
      setLocalSubscription(propSubscription);
      const pid = extractPlanId(propSubscription);
      if (pid) setSelectedPlan(pid);
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('subscription') || 'null');
        if (stored) {
          setLocalSubscription(stored);
          const pid = extractPlanId(stored);
          if (pid) setSelectedPlan(pid);
        } else {
          setLocalSubscription(null);
        }
      } catch (e) {
        setLocalSubscription(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSubscription]);

  // Listen for BroadcastChannel messages from Admin to refresh plans
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return undefined;

    const bc = new BroadcastChannel('submanager');
    const handler = (ev) => {
      try {
        if (ev?.data?.type === 'plans-updated') {
          loadPlans();
        }
      } catch (e) { /* ignore */ }
    };
    bc.addEventListener('message', handler);
    return () => {
      bc.removeEventListener('message', handler);
      bc.close();
    };
  }, []);

  // Sync subscription changes via storage event (other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'subscription') return;
      try {
        const newSub = JSON.parse(e.newValue || 'null');
        setLocalSubscription(newSub);
        const pid = extractPlanId(newSub);
        if (pid) setSelectedPlan(pid);
      } catch (err) {
        setLocalSubscription(null);
        setSelectedPlan(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Decide canonical current plan id
  const currentPlanId = (() => {
    const fromProp = extractPlanId(propSubscription);
    if (fromProp) return fromProp;
    const fromLocal = extractPlanId(localSubscription);
    if (fromLocal) return fromLocal;
    return null;
  })();

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
    setSelectedPlan(plan.id || plan._id);

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
        body: JSON.stringify({ planId: plan._id || plan.id, priceId: plan.priceId, userId: userNow.id || userNow._id })
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Server responded ${resp.status}: ${text || resp.statusText}`);
      }

      const session = await resp.json();

      if (session.url) {
        // redirect (server returned a hosted checkout url)
        window.location.href = session.url;
        return;
      }

      if (session.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to initialize.');
        const { error } = await stripe.redirectToCheckout({ sessionId: session.sessionId });
        if (error) throw error;
        return;
      }

      throw new Error(session.message || 'No checkout URL returned from server.');
    } catch (err) {
      console.error('Subscription error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
      setSelectedPlan(currentPlanId); // revert selection on error
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) return <p className="text-center py-8 text-gray-500">Loading plans...</p>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className={`text-4xl font-bold ${textClass} mb-4`}>Choose Your Plan</h2>
        <p className={textSecondary}>Select the perfect plan for your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const planId = String(plan._id || plan.id);
          const isActive = selectedPlan === planId;
          const isCurrentPlan = String(currentPlanId) === planId;

          return (
            <div
              key={planId}
              className={` ${cardBg} rounded-2xl p-8 shadow-xl border flex flex-col justify-between transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-indigo-400
                ${isActive ? 'border-4 border-indigo-500 scale-105' : 'border-gray-200'}`}>
              {index === 1 && <div className="bg-indigo-500 text-white text-sm font-bold px-4 py-3 rounded-full inline-block mb-4">POPULAR</div>}

              <h3 className={`text-2xl font-bold ${textClass} mb-2`}>{plan.name}</h3>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${textClass}`}>${plan.price}</span>
                <span className={textSecondary}>/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {(plan.features || []).map((feature, i) => (
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
                  isCurrentPlan
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : (loading && isActive ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700')
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
