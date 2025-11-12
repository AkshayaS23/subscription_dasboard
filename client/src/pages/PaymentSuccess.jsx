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
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const planId = searchParams.get('plan_id');

      if (!sessionId || !planId) {
        setError('Invalid payment session');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payment-success?session_id=${sessionId}&plan_id=${planId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        const data = await response.json();

        if (data.success) {
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setError(data.message || 'Verification failed');
        }
      } catch (err) {
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-xl text-gray-700">Verifying your payment...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">❌ {error}</div>
        <button onClick={() => navigate('/plans')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Plans</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-600 mb-8">Your subscription has been activated.</p>
        <p className="text-gray-500">Redirecting to dashboard in 3 seconds...</p>
      </div>
    </div>
  );
}
