import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, Role } from '@/src/types';

interface ProtectedRouteProps {
  user: User | null;
  allowedRole: Role;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRole, children }) => {
  // If not logged in, redirect to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role doesn't match, redirect to their proper dashboard
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // If role matches, render the nested routes (children)
  return <>{children}</>;
};
