// client/src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const sessionId = searchParams.get('session_id');
    const planId = searchParams.get('plan_id');

    if (!sessionId || !planId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    const authHeader = () => {
      const token = localStorage.getItem('accessToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Call your info endpoint (optional) to check stripe session status
    const verifySession = async () => {
      try {
        const res = await fetch(`/api/payment-success?session_id=${sessionId}&plan_id=${planId}`, {
          headers: { 'Content-Type': 'application/json', ...authHeader() }
        });
        // If your server returns 401 here (no auth), server might be configured without auth for this route.
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          console.warn('payment-success returned non-OK:', res.status, t);
          return false;
        }
        const json = await res.json();
        return !!(json && json.success);
      } catch (err) {
        console.error('verifySession error', err);
        return false;
      }
    };

    // Poll /api/subscriptions/me until DB shows subscription (webhook might be slightly delayed)
    const pollForSubscription = async (retries = 8, delayMs = 1200) => {
      for (let i = 0; i < retries && mounted; i += 1) {
        try {
          const resp = await fetch('/api/subscriptions/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', ...authHeader() }
          });

          if (resp.status === 401) {
            // Not authenticated — redirect user to login (or handle as you prefer)
            setError('You are not authenticated. Please login to see your subscription.');
            setLoading(false);
            return null;
          }

          if (!resp.ok) {
            // keep retrying on 5xx/network errors
            console.warn('subscriptions/me returned', resp.status);
          } else {
            const data = await resp.json();
            // We expect: { success: true, subscription: <obj|null> }
            const subscription = data?.subscription ?? data?.data ?? null;
            if (subscription) {
              // Persist so other pages (Plans, Dashboard) can read it
              try {
                localStorage.setItem('subscription', JSON.stringify(subscription));
              } catch (e) {
                console.warn('Failed to persist subscription to localStorage', e);
              }
              return subscription;
            }
          }
        } catch (err) {
          console.warn('pollForSubscription fetch error', err);
        }

        // wait before retrying
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return null;
    };

    const run = async () => {
      setLoading(true);
      setError(null);

      // First verify payment session (best-effort)
      const ok = await verifySession();
      if (!mounted) return;

      // proceed to poll the DB for subscription (webhook authoritative)
      const sub = await pollForSubscription(10, 1200); // ~12s total
      if (!mounted) return;

      if (sub) {
        // Optionally: also refresh user info if you have endpoint to get user and their subscription
        // Save indicator and navigate
        setLoading(false);
        navigate('/dashboard');
      } else {
        setLoading(false);
        setError('Payment processed but subscription not found yet. Try refreshing the dashboard in a few seconds.');
      }
    };

    run();

    return () => { mounted = false; };
  }, [searchParams, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-xl text-gray-700">Finalizing your subscription — this may take a few seconds...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">❌ {error}</div>
        <div className="mb-4 text-sm text-gray-600">If you don't see your subscription, wait a moment and refresh your dashboard.</div>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/plans')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Plans</button>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Refresh</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-600 mb-8">Your subscription has been activated.</p>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
