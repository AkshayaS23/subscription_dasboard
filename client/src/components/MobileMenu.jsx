import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MobileMenu({ user, mobileMenuOpen, setMobileMenuOpen, handleLogout }) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavigate = (path) => {
    console.log('MobileMenu navigate ->', path);
    setMobileMenuOpen(false); // close menu after navigation
    // give slight delay so menu close animation (if any) can start
    setTimeout(() => navigate(path), 50);
  };

  return (
    // use a dedicated debug class and a high z-index to avoid being behind other elements
    <div
      className={`mobile-menu-debug md:hidden mt-4 space-y-2 z-50`}
      role="menu"
      aria-hidden={!mobileMenuOpen}
      style={{ display: mobileMenuOpen ? 'block' : 'none', position: 'absolute', top: '72px', left: 0, right: 0 }}
    >
      <div className="bg-white dark:bg-gray-800 p-4 shadow-lg rounded-md mx-4">
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Dashboard
        </button>

        <button
          onClick={() => handleNavigate('/plans')}
          className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Plans
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => handleNavigate('/admin')}
            className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Admin
          </button>
        )}

        <button
          onClick={() => {
            console.log('MobileMenu logout clicked');
            handleLogout();
            setMobileMenuOpen(false);
            setTimeout(() => navigate('/login'), 50);
          }}
          className="block w-full text-left px-4 py-2 text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
