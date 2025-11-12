// src/components/Navigation.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
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
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg transition-colors ${
      isActive 
        ? 'text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-900/20' 
        : `${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10`
    }`;

  return (
    <nav className={`${cardBg} shadow-lg z-50`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-8 h-8 text-indigo-600" />
            <span className={`text-xl font-bold ${textClass}`}>SubManager</span>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/plans" className={linkClass}>
                Plans
              </NavLink>

              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={linkClass}>
                    Admin Dashboard
                  </NavLink>
                  <NavLink to="/admin/plans" className={linkClass}>
                    Manage Plans
                  </NavLink>
                  <NavLink to="/admin/subscriptions" className={linkClass}>
                    Subscriptions
                  </NavLink>
                </>
              )}

              <div className="flex items-center space-x-4 ml-4">
                <span className={`${textSecondary} text-sm`}>{user.name}</span>
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {user && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden" 
              aria-label="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        <MobileMenu
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleLogout={handleLogout}
        />
      </div>
    </nav>
  );
}