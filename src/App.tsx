import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CarTravelingLoader } from "./components/LoadingAnimations";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";

// Lazy load pages for better performance with preload optimization
const Index = React.lazy(() => {
  // Preload critical modules
  import("./pages/Index");
  return import("./pages/Index");
});

const Auth = React.lazy(() => {
  // Preload critical modules
  import("./pages/Auth");
  return import("./pages/Auth");
});

const Booking = React.lazy(() => {
  // Preload critical modules
  import("./pages/Booking");
  return import("./pages/Booking");
});

const AdminDashboard = React.lazy(() => {
  // Preload critical modules
  import("./pages/AdminDashboard");
  return import("./pages/AdminDashboard");
});

const UserDashboard = React.lazy(() => {
  // Preload critical modules
  import("./pages/UserDashboard");
  return import("./pages/UserDashboard");
});

const NotFound = React.lazy(() => {
  // Preload critical modules
  import("./pages/NotFound");
  return import("./pages/NotFound");
});

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <OfflineBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Suspense fallback={<CarTravelingLoader message="Loading RP cars..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/booking/:carId" element={<Booking />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;