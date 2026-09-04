import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { isSuperAdmin } from '../utils/authPermissions';

/**
 * Requiere sesión + rol super admin (o permisos equivalentes vía `user`).
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
