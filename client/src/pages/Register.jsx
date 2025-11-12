// client/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import Toast from '../components/Toast';
import { authAPI } from '../services/api'; // ensure this exists and points to /auth/register

export default function Register({ registerForm, setRegisterForm, darkMode, setLoginForm }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration + 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // client-side validation
    if (!registerForm?.name?.trim() || !registerForm?.email?.trim() || !registerForm?.password?.trim() || !confirmPassword.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (registerForm.password !== confirmPassword) {
      showToast('Passwords do not match. Please try again.', 'error', 4000);
      return;
    }

    setLoading(true);
    try {
      // Call backend register endpoint
      const resp = await authAPI.register({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });

      // Expect backend returns { message, data: { user, accessToken, refreshToken } } or similar
      console.log('Register response:', resp.data);

      showToast('Account created successfully! Please sign in.', 'success', 2500);

      // Prefill login email (so Login page can show a toast & prefill)
      if (typeof setLoginForm === 'function') {
        setLoginForm((prev) => ({ ...prev, email: registerForm.email.trim(), password: '' }));
      }

      // Clear the register form (optional)
      setRegisterForm({ name: '', email: '', password: '' });
      setConfirmPassword('');

      // Navigate to login and pass state to trigger login toast
      setTimeout(() => {
        navigate('/login', { state: { showSignedUpToast: true, email: registerForm.email.trim() } });
      }, 800);
    } catch (err) {
      console.error('Register error:', err);
      // derive message
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err.message ||
        'Registration failed';
      showToast(String(msg), 'error', 4500);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="flex items-center justify-center min-h-screen relative">
      <Toast toast={toast} onClose={() => setToast(null)} duration={4000} darkMode={darkMode} />

      <div className={`${cardBg} p-8 rounded-2xl shadow-2xl w-full max-w-md`}>
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className={`text-3xl font-bold ${textClass}`}>Create Account</h2>
          <p className={textSecondary}>Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className={`block mb-2 ${textClass}`}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className={`block mb-2 ${textClass}`}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="user@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block mb-2 ${textClass}`}>
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="Enter your password"
            />
          </div>

          {/* Re-enter Password */}
          <div>
            <label className={`block mb-2 ${textClass}`}>
              Re-enter Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="Re-enter your password"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
