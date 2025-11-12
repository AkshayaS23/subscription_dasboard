import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';

export default function AdminDashboard({ darkMode }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className={`text-3xl font-bold mb-6 ${textClass}`}>Admin Dashboard</h1>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8">
        <NavLink
          to="plans"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md font-semibold ${
              isActive
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-100'
                : 'bg-gray-100 text-gray-800'
            }`
          }
        >
          Manage Plans
        </NavLink>
        <NavLink
          to="subscriptions"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md font-semibold ${
              isActive
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-100'
                : 'bg-gray-100 text-gray-800'
            }`
          }
        >
          Subscriptions
        </NavLink>
      </div>

      {/* Nested content */}
      <div className={`${cardBg} p-6 rounded-2xl shadow-xl`}>
        <Outlet />
      </div>
    </div>
  );
}
