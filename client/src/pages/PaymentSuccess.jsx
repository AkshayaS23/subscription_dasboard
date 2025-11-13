// client/src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccess({ darkMode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Invalid payment session - no session ID found');
      setLoading(false);
      return;
    }

    const getAuthHeaders = () => {
      const token = localStorage.getItem('accessToken');
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
    };

    const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '';

    // Poll for subscription until it appears in the database
    const pollForSubscription = async (maxRetries = 10, delayMs = 1500) => {
      console.log(`Polling for subscription (attempt ${retryCount + 1}/${maxRetries})...`);

      for (let i = 0; i < maxRetries && mounted; i++) {
        if (!mounted) break;

        try {
          const url = API_ROOT ? `${API_ROOT}/api/subscriptions/me` : '/api/subscriptions/me';
          const resp = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
          });

          if (!mounted) break;

          // Handle authentication errors
          if (resp.status === 401) {
            setError('Session expired. Please log in again.');
            setLoading(false);
            setTimeout(() => navigate('/login'), 2000);
            return null;
          }

          // Handle server errors - keep retrying
          if (!resp.ok) {
            console.warn(`Subscription check returned ${resp.status}, retrying...`);
            setRetryCount(i + 1);
          } else {
            const data = await resp.json();
            console.log('Subscription response:', data);

            // Check for subscription data
            const subscription = data?.subscription;
            
            if (subscription && subscription.id) {
              // Subscription found! Save to localStorage
              try {
                localStorage.setItem('subscription', JSON.stringify(subscription));
                console.log('✅ Subscription saved to localStorage');
              } catch (e) {
                console.warn('Failed to save subscription to localStorage:', e);
              }

              // Dispatch storage event so other tabs/components update
              try {
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'subscription',
                  newValue: JSON.stringify(subscription),
                }));
              } catch (e) {
                console.warn('Failed to dispatch storage event:', e);
              }

              return subscription;
            }
          }
        } catch (err) {
          console.warn('Subscription polling error:', err);
          setRetryCount(i + 1);
        }

        // Wait before next retry
        if (i < maxRetries - 1) {
          await new Promise((resolve) => {
            timeoutId = setTimeout(resolve, delayMs);
          });
        }
      }

      return null;
    };

    const verifyPayment = async () => {
      setLoading(true);
      setError(null);

      // Wait a moment for webhook to process
      await new Promise((resolve) => {
        timeoutId = setTimeout(resolve, 2000);
      });

      if (!mounted) return;

      // Poll for subscription
      const subscription = await pollForSubscription(10, 1500); // ~15 seconds total

      if (!mounted) return;

      if (subscription) {
        setLoading(false);
        // Show success briefly before redirecting
        setTimeout(() => {
          if (mounted) navigate('/dashboard');
        }, 1500);
      } else {
        setLoading(false);
        setError(
          'Payment processed successfully, but your subscription is still being activated. ' +
          'This usually takes just a few seconds. Please check your dashboard.'
        );
      }
    };

    verifyPayment();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, navigate, darkMode, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`${cardBg} rounded-2xl shadow-xl p-12 max-w-md w-full text-center`}>
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
          <h2 className={`text-2xl font-bold ${textClass} mb-3`}>Processing Payment</h2>
          <p className={`${textSecondary} mb-4`}>
            Please wait while we activate your subscription...
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-indigo-600">
              Checking subscription status... (attempt {retryCount}/10)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`${cardBg} rounded-2xl shadow-xl p-12 max-w-md w-full text-center`}>
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className={`text-2xl font-bold ${textClass} mb-3`}>Payment Processed</h2>
          <p className={`${textSecondary} mb-6`}>{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate('/plans')}
              className={`w-full px-6 py-3 rounded-lg font-semibold ${textSecondary} hover:underline`}
            >
              Back to Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`${cardBg} rounded-2xl shadow-xl p-12 max-w-md w-full text-center`}>
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        
        <h1 className={`text-3xl font-bold ${textClass} mb-3`}>Payment Successful!</h1>
        <p className={`text-xl ${textSecondary} mb-6`}>
          Your subscription has been activated successfully.
        </p>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-green-800 dark:text-green-300 text-sm">
            ✓ Payment confirmed<br />
            ✓ Subscription activated<br />
            ✓ Full access granted
          </p>
        </div>

        <p className={`text-sm ${textSecondary}`}>
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}