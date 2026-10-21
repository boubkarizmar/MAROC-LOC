import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingComponents';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireProprietaire?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin,
  requireProprietaire,
}) => {
  const { isAuthenticated, isAdmin, isProprietaire, isLoading } = useAuth();

  // Wait for auth rehydration before deciding to redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (requireProprietaire && !isProprietaire && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
