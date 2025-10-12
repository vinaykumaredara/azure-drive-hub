import React, { Suspense, useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider.component";
import { useAuth } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CarTravelingLoader } from "./components/LoadingAnimations";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import { useBookingFlow } from './hooks/useBookingFlow';
import { getPendingIntent } from './utils/bookingIntentUtils';
import { toast } from './hooks/use-toast';
import { BookingProvider } from './contexts/BookingContext';

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

const MockPaymentSuccess = React.lazy(() => 
  import("@/pages/MockPaymentSuccess").then(module => ({ default: module.MockPaymentSuccess }))
);

// Component to handle booking intent resume logic with improved reliability
const BookingIntentHandler: React.FC = () => {
  const { user } = useAuth();
  const { openBookingModal, closeBookingModal, isBookingModalOpen } = useBookingFlow();
  const location = useLocation();
  const [isProviderReady, setIsProviderReady] = useState(false);
  
  // Mark provider as ready after a short delay to ensure everything is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProviderReady(true);
      console.debug('[App] Booking provider marked as ready');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Only run resume logic when provider is ready
    if (!isProviderReady) {
      return;
    }
    
    const resumeBookingIntent = async () => {
      // Check for URL params resume
      const params = new URLSearchParams(location.search);
      if (params.get('resume') === 'book' && params.get('carId') && user) {
        try {
          console.debug('[App] Found resume URL params, attempting resume');
          
          toast({
            title: "Resuming your booking",
            description: "We're resuming your booking automatically...",
          });
          
          // Resume from URL params
          const carId = params.get('carId');
          if (carId) {
            // Remove resume params from URL
            params.delete('resume');
            params.delete('carId');
            const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            window.history.replaceState({}, '', newUrl);
            
            // Import the resume function dynamically
            const { resumePendingIntent } = await import('./utils/bookingIntentUtils');
            
            // Resume the pending intent using our utility function
            const success = await resumePendingIntent(openBookingModal);
            if (!success) {
              console.warn('[App] Failed to resume booking from URL params');
              toast({
                title: "Booking resume failed",
                description: "We couldn't resume your booking from URL. Please try again.",
                variant: "destructive",
              });
            } else {
              console.debug('[App] Successfully resumed booking from URL params');
            }
          }
        } catch (err) {
          console.error('[App] Error resuming booking from URL params:', err);
          toast({
            title: "Booking resume failed",
            description: "We couldn't resume your booking from URL. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    resumeBookingIntent();
  }, [user, openBookingModal, closeBookingModal, isBookingModalOpen, location, isProviderReady]);
  
  return null;
};

// Wrapper component that provides the booking context
const BookingContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { openBookingModal, closeBookingModal, isBookingModalOpen } = useBookingFlow();
  
  return (
    <BookingProvider 
      openBookingModal={openBookingModal}
      closeBookingModal={closeBookingModal}
      isBookingModalOpen={isBookingModalOpen}
    >
      {children}
    </BookingProvider>
  );
};

const AppRoutes: React.FC = () => (
  <>
    <BookingIntentHandler />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/booking/:carId" element={<Booking />} />
      <Route path="/mock-pay-success" element={<MockPaymentSuccess />} />
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
  </>
);

const AppContent: React.FC = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingContextWrapper>
          <TooltipProvider>
            <OfflineBanner />
            <Toaster />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Suspense fallback={<CarTravelingLoader message="Loading RP cars..." />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </BookingContextWrapper>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

const App = () => <AppContent />;

export default App;