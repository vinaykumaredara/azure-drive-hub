// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "@/lib/auth";

interface Props {
  children: JSX.Element;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ children, requireAdmin = false }) => {
  const auth = getAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && !auth.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};