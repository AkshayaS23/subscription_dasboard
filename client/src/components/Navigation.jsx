// src/components/Navigation.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Crown, LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';

export default function Navigation({
  user,
  darkMode,
  setDarkMode,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout
}) {
  const navigate = useNavigate();
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  // small click debug helper
  const onNavigate = (path) => {
    console.log('nav click ->', path);
    navigate(path);
  };

  const linkClass = ({ isActive }) =>
    `px-2 py-1 rounded ${isActive ? 'text-indigo-600 font-semibold' : textSecondary}`;

  return (
    <nav className={`${cardBg} shadow-lg`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-8 h-8 text-indigo-600" />
            <span className={`text-xl font-bold ${textClass}`}>SubManager</span>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-6">
              {/* Use NavLink so Router handles active state and navigation reliably */}
              <NavLink to="/dashboard" className={linkClass} onClick={() => onNavigate('/dashboard')}>
                Dashboard
              </NavLink>

              <NavLink to="/plans" className={linkClass} onClick={() => onNavigate('/plans')}>
                Plans
              </NavLink>

              {user.role === 'admin' && (
                <NavLink to="/admin" className={linkClass} onClick={() => onNavigate('/admin')}>
                  Admin
                </NavLink>
              )}

              <div className="flex items-center space-x-4">
                <span className={textSecondary}>{user.name}</span>
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button
                  onClick={() => {
                    console.log('logout click');
                    handleLogout();
                    navigate('/login');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {user && (
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        <MobileMenu
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          navigate={navigate}
          handleLogout={() => {
            handleLogout();
            navigate('/login');
          }}
        />
      </div>
    </nav>
  );
}
