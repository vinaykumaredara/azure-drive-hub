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
import { ErrorBoundary } from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";

// Lazy load pages for better performance
const Index = React.lazy(() => import("./pages/Index"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Booking = React.lazy(() => import("./pages/Booking"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const UserDashboard = React.lazy(() => import("./pages/UserDashboard"));
const TestPage = React.lazy(() => import("./pages/TestPage"));
const ImageDebugPage = React.lazy(() => import("./pages/ImageDebugPage"));
const ImageAlignmentDebugPage = React.lazy(() => import("./pages/ImageAlignmentDebugPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));



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
                <Route path="/test" element={<TestPage />} />
                <Route path="/debug-images" element={<ImageDebugPage />} />
                <Route path="/debug-image-alignment" element={<ImageAlignmentDebugPage />} />
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