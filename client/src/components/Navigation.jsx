// src/components/Navigation.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';

export default function Navigation({ user, darkMode, setDarkMode, mobileMenuOpen, setMobileMenuOpen, handleLogout }) {
  const navigate = useNavigate();
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

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
              <button onClick={() => navigate('/dashboard')} className={`${textSecondary} hover:text-indigo-600`}>Dashboard</button>
              <button onClick={() => navigate('/plans')} className={`${textSecondary} hover:text-indigo-600`}>Plans</button>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/admin')} className={`${textSecondary} hover:text-indigo-600`}>Admin</button>
              )}
              <div className="flex items-center space-x-4">
                <span className={textSecondary}>{user.name}</span>
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button onClick={() => { handleLogout(); navigate('/login'); }} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
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
          handleLogout={() => { handleLogout(); navigate('/login'); }}
        />
      </div>
    </nav>
  );
}
