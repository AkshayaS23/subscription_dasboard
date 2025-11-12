// client/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // removed BrowserRouter import
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Dashboard from './pages/Dashboard';
// import Admin from './pages/Admin';
import { mockPlans } from './utils/mockPlans';
import { loginMock, registerMock } from './services/auth';
import { useLocalStorage } from './utils/useLocalStorage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPlans from './pages/AdminPlans';
import AdminSubscriptions from './pages/AdminSubscriptions';
import { authAPI } from './services/api';

const App = () => {
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [currentPage, setCurrentPage] = useLocalStorage('currentPage', 'login');
  const [user, setUser] = useLocalStorage('user', null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = React.useState({ name: '', email: '', password: '' });
  const [subscription, setSubscription] = useLocalStorage('subscription', null);

  useEffect(() => {
    if (user) setCurrentPage('dashboard');
  }, []); // runs once

  const handleLogin = async (payloadOrEvent) => {
    if (payloadOrEvent && typeof payloadOrEvent === 'object' && payloadOrEvent.id) {
      setUser(payloadOrEvent);
      localStorage.setItem('user', JSON.stringify(payloadOrEvent));
      setCurrentPage('dashboard');
      return;
    }
    try {
      const mockUser = loginMock({ email: loginForm.email });
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setCurrentPage('dashboard');
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleRegister = async (payloadOrEvent) => {
    if (payloadOrEvent && typeof payloadOrEvent === 'object' && payloadOrEvent.id) {
      setUser(payloadOrEvent);
      localStorage.setItem('user', JSON.stringify(payloadOrEvent));
      setCurrentPage('dashboard');
      return;
    }
    try {
      const newUser = registerMock({ name: registerForm.name, email: registerForm.email });
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      setCurrentPage('dashboard');
    } catch (err) {
      console.error('Register failed', err);
    }
  };

  const handleSubscribe = (planId) => {
    const plan = mockPlans.find(p => p.id === planId);
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
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCurrentPage('login');
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* NO Router here — main.jsx provides the BrowserRouter */}
      {user && <Navigation
        user={user}
        setCurrentPage={setCurrentPage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
      />}

      <Routes>
        <Route path="/login" element={<Login loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} darkMode={darkMode} />} />
        <Route path="/register" element={<Register registerForm={registerForm} setRegisterForm={setRegisterForm} handleRegister={handleRegister} darkMode={darkMode} setLoginForm={setLoginForm} />} />
        <Route path="/plans" element={user ? <Plans handleSubscribe={handleSubscribe} darkMode={darkMode} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} subscription={subscription} darkMode={darkMode} setUser={setUser} /> : <Navigate to="/login" />} />
         <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard darkMode={darkMode} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="plans" replace />} />
          <Route path="plans" element={<AdminPlans darkMode={darkMode} />} />
          <Route path="subscriptions" element={<AdminSubscriptions darkMode={darkMode} />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
};

export default App;
