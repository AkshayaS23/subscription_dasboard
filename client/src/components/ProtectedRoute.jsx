// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Usage: <ProtectedRoute user={user}><Dashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
