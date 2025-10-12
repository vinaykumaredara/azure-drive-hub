import React, { Suspense, useEffect } from 'react';
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
import { getPendingIntent, resumePendingIntent } from './utils/bookingIntentUtils';
import { toast } from './hooks/use-toast';

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

// Component to handle booking intent resume logic
const BookingIntentHandler: React.FC = () => {
  const { user } = useAuth();
  const { openBookingModal } = useBookingFlow();
  const location = useLocation();
  
  useEffect(() => {
    const resumeBookingIntent = async () => {
      // Check for pending intent in localStorage
      const intent = getPendingIntent();
      if (intent && user) {
        try {
          toast({
            title: "Resuming your booking",
            description: "We're resuming your booking automatically...",
          });
          
          // Resume the pending intent
          const success = await resumePendingIntent(openBookingModal);
          if (!success) {
            toast({
              title: "Booking resume failed",
              description: "We couldn't resume your booking. Please try again.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('[App] Error resuming booking intent:', err);
          toast({
            title: "Booking resume failed",
            description: "We couldn't resume your booking. Please try again.",
            variant: "destructive",
          });
        }
      }
      
      // Check for URL params resume
      const params = new URLSearchParams(location.search);
      if (params.get('resume') === 'book' && params.get('carId') && user) {
        try {
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
            
            // Resume the pending intent using our utility function
            const success = await resumePendingIntent(openBookingModal);
            if (!success) {
              toast({
                title: "Booking resume failed",
                description: "We couldn't resume your booking from URL. Please try again.",
                variant: "destructive",
              });
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
  }, [user, openBookingModal, location]);
  
  return null;
};

const AppContent: React.FC = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <OfflineBanner />
          <Toaster />
          <BookingIntentHandler />
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

const App = () => <AppContent />;

export default App;