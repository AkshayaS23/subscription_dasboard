// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Check, X, Edit2 } from 'lucide-react';
import Toast from '../components/Toast';
import { authAPI } from '../services/api';

export default function Dashboard({ user, subscription: propSubscription, darkMode, setUser }) {
  const navigate = useNavigate();

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  // local editable copy of user fields
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // subscription state: prefer propSubscription, else local fetch
  const [subscription, setSubscription] = useState(propSubscription || null);
  const [loadingSub, setLoadingSub] = useState(false);

  // keep form in sync if parent user changes
  useEffect(() => {
    setForm({ name: user?.name || '', email: user?.email || '' });
  }, [user?.name, user?.email]);

  // keep local subscription updated when parent gives a prop
  useEffect(() => {
    if (propSubscription) {
      setSubscription(propSubscription);
      try {
        localStorage.setItem('subscription', JSON.stringify(propSubscription));
      } catch (e) { /* ignore */ }
    }
  }, [propSubscription]);

  // If no subscription prop, fetch from backend on mount
  useEffect(() => {
    let mounted = true;
    const loadSubscription = async () => {
      // don't fetch if parent already provided a subscription
      if (propSubscription) return;

      setLoadingSub(true);
      try {
        const token = localStorage.getItem('accessToken'); // adapt if you store differently
        const res = await fetch('/api/subscriptions/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!mounted) return;

        if (res.status === 401) {
          // Not authenticated -> clear subscription and bail
          setSubscription(null);
          localStorage.removeItem('subscription');
          setLoadingSub(false);
          return;
        }

        const data = await res.json();
        if (data && data.subscription) {
          setSubscription(data.subscription);
          try {
            localStorage.setItem('subscription', JSON.stringify(data.subscription));
          } catch (e) { /* ignore */ }

          // optionally update parent user/subscription state if available (helpful to re-render Plans)
          if (typeof setUser === 'function') {
            try {
              // If you want to attach subscription into user object, do so carefully
              setUser((prev) => ({ ...prev, subscription: data.subscription }));
            } catch (e) {
              console.warn('setUser failed', e);
            }
          }
        } else {
          setSubscription(null);
          localStorage.removeItem('subscription');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        if (mounted) setLoadingSub(false);
      }
    };

    loadSubscription();
    return () => { mounted = false; };
  }, [propSubscription, setUser]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration + 200);
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Name and Email are required.', 'warning', 3500);
      return false;
    }
    // simple email regex
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email.trim())) {
      showToast('Please enter a valid email address.', 'warning', 3500);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // call backend to update profile
      const res = await authAPI.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      // assume backend returns { data: { /* user */ } } or { data: user }
      const updated = res?.data?.data || res?.data;
      const updatedUser = updated?.user || updated;

      // update localStorage
      if (updatedUser) {
        const stored = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...updatedUser };
        localStorage.setItem('user', JSON.stringify(stored));
      } else {
        const fallback = { ...JSON.parse(localStorage.getItem('user') || '{}'), name: form.name.trim(), email: form.email.trim() };
        localStorage.setItem('user', JSON.stringify(fallback));
      }

      // update parent state if setter provided
      if (typeof setUser === 'function') {
        try {
          setUser(updatedUser || { ...user, name: form.name.trim(), email: form.email.trim() });
        } catch (e) {
          console.warn('setUser failed', e);
        }
      }

      showToast('Profile updated successfully.', 'success', 3000);
      setEditing(false);
    } catch (err) {
      console.error('Profile update failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'Failed to update profile';
      showToast(String(msg), 'error', 4500);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Toast toast={toast} onClose={() => setToast(null)} duration={4000} darkMode={darkMode} />

      <h2 className={`text-3xl font-bold ${textClass} mb-8`}>Dashboard</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className={`${cardBg} rounded-2xl shadow-xl p-8`}>
          <div className="flex items-start justify-between">
            <h3 className={`text-xl font-bold ${textClass} mb-4`}>Profile Information</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-4 h-4" />
                <span className={textSecondary}>Edit</span>
              </button>
            ) : null}
          </div>

          {!editing ? (
            <div className="space-y-3">
              <div>
                <p className={textSecondary}>Name</p>
                <p className={`${textClass} font-semibold`}>{user?.name}</p>
              </div>
              <div>
                <p className={textSecondary}>Email</p>
                <p className={`${textClass} font-semibold`}>{user?.email}</p>
              </div>
              <div>
                <p className={textSecondary}>Role</p>
                <p className={`${textClass} font-semibold capitalize`}>{user?.role}</p>
              </div>
            </div>
          ) : (
            // Edit form
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 ${textClass}`}>Full Name <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block mb-2 ${textClass}`}>Email <span className="text-red-500">*</span></label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'}`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>

                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subscription card */}
        <div className={`${cardBg} rounded-2xl shadow-xl p-8`}>
          <h3 className={`text-xl font-bold ${textClass} mb-4`}>Subscription Status</h3>

          {loadingSub ? (
            <div>Loading subscription...</div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={textSecondary}>Current Plan</span>
                <span className={`${textClass} font-bold text-xl`}>{subscription.plan?.name || subscription.planName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textSecondary}>Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textSecondary}>Renewal Date</span>
                <span className={textClass}>{new Date(subscription.endDate).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => navigate('/plans')}
                className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center space-x-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`${textSecondary} mb-4`}>No active subscription</p>
              <button onClick={() => navigate('/plans')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer">
                Browse Plans
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
