import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, role, isInitializing } = useAuth();

  // 1. Loading state while checking active session from Supabase
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          label="Memverifikasi autentikasi & sesi pengguna..."
        />
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role-Based Access Control (RBAC) check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
