import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, Role } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';

interface ProtectedRouteProps {
  user?: User | null;
  allowedRole: Role;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user: propUser,
  allowedRole,
  children,
}) => {
  const { user: authUser, loading } = useAuth();
  const activeUser = propUser !== undefined ? propUser : authUser;

  // Render minimal loading state while resolving session
  if (loading && !activeUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Verifying Session…
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to landing page
  if (!activeUser) {
    return <Navigate to="/" replace />;
  }

  // If role doesn't match, strictly prevent privilege escalation and redirect to assigned portal
  if (activeUser.role !== allowedRole) {
    return <Navigate to={`/${activeUser.role}`} replace />;
  }

  // Render authorized children
  return <>{children}</>;
};
