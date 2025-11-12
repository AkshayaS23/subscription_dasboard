import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MobileMenu({ user, mobileMenuOpen, setMobileMenuOpen, handleLogout }) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false); // close menu after navigation
  };

  return (
    mobileMenuOpen && (
      <div className="md:hidden mt-4 space-y-2">
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100"
        >
          Dashboard
        </button>

        <button
          onClick={() => handleNavigate('/plans')}
          className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100"
        >
          Plans
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => handleNavigate('/admin')}
            className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100"
          >
            Admin
          </button>
        )}

        <button
          onClick={() => {
            handleLogout();
            setMobileMenuOpen(false);
            navigate('/login');
          }}
          className="block w-full text-left px-4 py-2 text-red-600 rounded hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    )
  );
}
