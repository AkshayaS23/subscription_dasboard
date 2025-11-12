// client/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPlans from './pages/AdminPlans';
import AdminSubscriptions from './pages/AdminSubscriptions';
import { mockPlans } from './utils/mockPlans';
import { loginMock, registerMock } from './services/auth';
import { useLocalStorage } from './utils/useLocalStorage';
import { authAPI } from './services/api';

const USE_MOCK = false; // toggle for demo/testing

const AppContent = () => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [user, setUser] = useLocalStorage('user', null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = React.useState({ name: '', email: '', password: '' });
  const [subscription, setSubscription] = useLocalStorage('subscription', null);

  // REMOVED: Auto-navigation useEffect that was causing loops
  // Navigation is now handled properly by each action

  // Real login handler (calls backend). Falls back to mock when USE_MOCK=true
  const handleLogin = async (payloadOrEvent) => {
    // If parent passed a user object directly, accept it
    if (payloadOrEvent && typeof payloadOrEvent === 'object' && payloadOrEvent.id) {
      setUser(payloadOrEvent);
      localStorage.setItem('user', JSON.stringify(payloadOrEvent));
      navigate('/dashboard', { replace: true });
      return;
    }

    try {
      if (USE_MOCK) {
        const mockUser = await loginMock({ email: loginForm.email, password: loginForm.password });
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        navigate('/dashboard', { replace: true });
        return;
      }

      // Call real backend
      const res = await authAPI.login({
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      const payload = res?.data?.data || res?.data;
      const returnedUser = payload?.user;
      const accessToken = payload?.accessToken || payload?.token;
      const refreshToken = payload?.refreshToken || null;

      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (returnedUser) {
        setUser(returnedUser);
        localStorage.setItem('user', JSON.stringify(returnedUser));
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('handleLogin error:', err?.response?.data || err.message || err);
      throw err;
    }
  };

  const handleRegister = async (payloadOrEvent) => {
    if (payloadOrEvent && typeof payloadOrEvent === 'object' && payloadOrEvent.id) {
      setUser(payloadOrEvent);
      localStorage.setItem('user', JSON.stringify(payloadOrEvent));
      navigate('/dashboard', { replace: true });
      return;
    }

    try {
      if (USE_MOCK) {
        const newUser = await registerMock({ name: registerForm.name, email: registerForm.email });
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        navigate('/dashboard', { replace: true });
        return;
      }

      const res = await authAPI.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      });

      const payload = res?.data?.data || res?.data;
      const returnedUser = payload?.user;
      const accessToken = payload?.accessToken || payload?.token;
      const refreshToken = payload?.refreshToken || null;

      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (returnedUser) {
        setUser(returnedUser);
        localStorage.setItem('user', JSON.stringify(returnedUser));
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('handleRegister error:', err?.response?.data || err.message || err);
      throw err;
    }
  };

  const handleSubscribe = (planId) => {
    const plan = mockPlans.find((p) => p.id === planId);
    const newSub = {
      id: Date.now().toString(),
      userId: user?.id,
      planId: plan.id,
      planName: plan.name,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };
    setSubscription(newSub);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login', { replace: true });
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {user && (
        <Navigation
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleLogout={handleLogout}
        />
      )}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                handleLogin={handleLogin}
                darkMode={darkMode}
              />
            )
          }
        />
        
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register
                registerForm={registerForm}
                setRegisterForm={setRegisterForm}
                handleRegister={handleRegister}
                darkMode={darkMode}
                setLoginForm={setLoginForm}
              />
            )
          }
        />

        {/* Protected User Routes */}
        <Route 
          path="/plans" 
          element={
            user ? (
              <Plans handleSubscribe={handleSubscribe} darkMode={darkMode} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Dashboard 
                user={user} 
                subscription={subscription} 
                darkMode={darkMode} 
                setUser={setUser} 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Admin Routes - FIXED: Flattened structure */}
        <Route 
          path="/admin" 
          element={
            user?.role === 'admin' ? (
              <AdminDashboard darkMode={darkMode} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        <Route 
          path="/admin/plans" 
          element={
            user?.role === 'admin' ? (
              <AdminPlans darkMode={darkMode} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        <Route 
          path="/admin/subscriptions" 
          element={
            user?.role === 'admin' ? (
              <AdminSubscriptions darkMode={darkMode} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />

        {/* Default & Catch-all Routes */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
        
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
};

// Main App wrapper with BrowserRouter
const App = () => {
  return <AppContent />;
};

export default App;