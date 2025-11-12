// client/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown } from 'lucide-react';
import Toast from '../components/Toast';
import { authAPI } from '../services/api'; // ensure this exists and points to /auth/login

export default function Login({ loginForm, setLoginForm, handleLogin, darkMode }) {
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration + 200);
  };

  // Prefill & toast if redirected from register
  useEffect(() => {
    if (location?.state?.showSignedUpToast) {
      showToast('Account created successfully! Please sign in.', 'success', 3500);
      if (location?.state?.email) {
        setLoginForm((prev) => ({ ...prev, email: location.state.email }));
      }
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // call backend login
      const res = await authAPI.login({
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      // expect backend response shape: { message, data: { user, accessToken, refreshToken } }
      const payload = res?.data?.data || res?.data;
      const user = payload?.user || payload;
      const accessToken = payload?.accessToken || payload?.token || null;
      const refreshToken = payload?.refreshToken || null;

      if (!user) {
        // fallback if backend returns different shape
        showToast('Login succeeded but no user returned. Check server response.', 'warning', 4000);
      }

      // store tokens & user
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      showToast('Signing in...', 'success', 900);

      // call parent's handler if provided (pass user)
      try {
        if (typeof handleLogin === 'function') {
          // allow parent to update its user state
          handleLogin(user);
        }
      } catch (err) {
        // ignore handler errors
        console.warn('handleLogin callback error', err);
      }

      // small delay so toast shows, then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        'Login failed';

      // map common status -> toast/message
      if (status === 404 || /not found/i.test(String(msg))) {
        showToast('This email is not registered — please sign up first.', 'warning', 4500);
      } else if (status === 401 || /invalid/i.test(String(msg))) {
        // clear only password on wrong cred
        setLoginForm((prev) => ({ ...prev, password: '' }));
        showToast('Password incorrect. Please try again.', 'error', 4500);
      } else {
        showToast(String(msg), 'error', 4500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative">
      <Toast toast={toast} onClose={() => setToast(null)} duration={4000} darkMode={darkMode} />

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-2xl w-full max-w-md`}>
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome Back</h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Sign in to your account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`block mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className={`block mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300'
              }`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={`text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-600 font-semibold hover:underline">
            Sign Up
          </button>
        </p>

        <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>Demo: admin@test.com / adminpass (admin) or user@test.com / userpass (user)</p>
        </div>
      </div>
    </div>
  );
}
