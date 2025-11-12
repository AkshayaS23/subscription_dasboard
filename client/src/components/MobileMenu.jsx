// src/components/MobileMenu.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function MobileMenu({ 
  user, 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  handleLogout 
}) {
  if (!mobileMenuOpen) return null;

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-indigo-600 text-white font-semibold' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
    }`;

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="md:hidden mt-4 space-y-2 pb-4">
      <NavLink 
        to="/dashboard" 
        className={linkClass}
        onClick={handleLinkClick}
      >
        Dashboard
      </NavLink>

      <NavLink 
        to="/plans" 
        className={linkClass}
        onClick={handleLinkClick}
      >
        Plans
      </NavLink>

      {user?.role === 'admin' && (
        <>
          <NavLink 
            to="/admin" 
            className={linkClass}
            onClick={handleLinkClick}
          >
            Admin Dashboard
          </NavLink>
          <NavLink 
            to="/admin/plans" 
            className={linkClass}
            onClick={handleLinkClick}
          >
            Manage Plans
          </NavLink>
          <NavLink 
            to="/admin/subscriptions" 
            className={linkClass}
            onClick={handleLinkClick}
          >
            Subscriptions
          </NavLink>
        </>
      )}

      <button
        onClick={() => {
          setMobileMenuOpen(false);
          handleLogout();
        }}
        className="w-full flex items-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </div>
  );
}