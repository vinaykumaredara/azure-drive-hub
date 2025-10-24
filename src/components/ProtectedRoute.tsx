// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStatus } from "@/hooks/useAuthStatus";

interface Props {
  children: JSX.Element;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ 
  children, 
  requireAdmin = false,
  requireUser = false 
}) => {
  const { user, isAdmin, isLoading } = useAuthStatus();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Prevent admins from accessing user-only routes
  if (requireUser && isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // Prevent non-admins from accessing admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};