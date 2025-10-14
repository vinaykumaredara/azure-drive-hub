import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { UserDashboardSidebar } from '@/components/UserDashboardSidebar';
import { PhoneModal } from '@/components/PhoneModal';
import { useBookingResume } from '@/hooks/useBookingResume';
import { useDashboardData } from '@/hooks/useDashboardData';
import { UserDashboardOverview } from '@/components/dashboard/UserDashboardOverview';
import { UserDashboardBookings } from '@/components/dashboard/UserDashboardBookings';
import { UserDashboardProfile } from '@/components/dashboard/UserDashboardProfile';
import ErrorBoundary from '@/components/ui/feedback/ErrorBoundary';

// Lazy load heavy components
const EnhancedBookingFlow = lazy(() => 
  import('@/components/EnhancedBookingFlow').then(module => ({ 
    default: module.EnhancedBookingFlow 
  }))
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const UserDashboard: React.FC = () => {
  const { user, signOut, profile, profileLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { resumedCar, clearResumedCar } = useBookingResume();
  const { bookings, userStats, notifications, isLoading, refetch } = useDashboardData(user?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [shouldOpenBooking, setShouldOpenBooking] = useState(false);
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('overview');

  // Handle resumed car
  useEffect(() => {
    if (resumedCar && !showPhoneModal && !profileLoading) {
      if (!profile?.phone) {
        setSelectedCarForBooking(resumedCar);
        setShowPhoneModal(true);
      } else {
        setSelectedCarForBooking(resumedCar);
        setShouldOpenBooking(true);
        clearResumedCar();
      }
    }
  }, [resumedCar, profile?.phone, showPhoneModal, profileLoading, clearResumedCar]);
  
  // Legacy sessionStorage handling
  useEffect(() => {
    if (!user?.id || profileLoading) return;

    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const draft = JSON.parse(pendingBooking);
        
        const fetchCarForBooking = async () => {
          try {
            const { data: carData, error } = await supabase
              .from('cars')
              .select('*')
              .eq('id', draft.carId)
              .single();
            
            if (error) throw error;
            
            if (carData) {
              const carForBooking = {
                id: carData.id,
                title: carData.title,
                image: carData.image_urls?.[0] || carData.image_paths?.[0] || '',
                pricePerDay: carData.price_per_day,
                price_in_paise: carData.price_in_paise,
                seats: carData.seats,
                fuel: carData.fuel_type,
                transmission: carData.transmission,
              };
              
              if (!profile?.phone) {
                setShowPhoneModal(true);
                setSelectedCarForBooking(carForBooking);
              } else {
                setSelectedCarForBooking(carForBooking);
                setShouldOpenBooking(true);
              }
              
              sessionStorage.removeItem('pendingBooking');
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to restore your booking. Please try again.",
              variant: "destructive",
            });
            sessionStorage.removeItem('pendingBooking');
          }
        };
        
        fetchCarForBooking();
      } catch (error) {
        sessionStorage.removeItem('pendingBooking');
      }
    }
  }, [user?.id, profile?.phone, profileLoading]);

  // Auto-trigger phone collection for new Google OAuth users
  useEffect(() => {
    if (!user?.id || profileLoading) return;
    
    // Check if phone collection is needed after Google OAuth
    const needsPhone = sessionStorage.getItem('needsPhoneCollection');
    const isNewUser = sessionStorage.getItem('isNewGoogleUser');
    
    if (needsPhone === 'true' && !profile?.phone) {
      // Open phone modal for new Google users
      setShowPhoneModal(true);
      
      // Clear the needsPhoneCollection flag
      sessionStorage.removeItem('needsPhoneCollection');
    }
  }, [user?.id, profile?.phone, profileLoading]);

  const handlePhoneModalComplete = async () => {
    setShowPhoneModal(false);
    await refreshProfile();
    
    setTimeout(() => {
      if (selectedCarForBooking) {
        setShouldOpenBooking(true);
      }
    }, 500);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <UserDashboardSidebar 
            onSignOut={handleLogout}
            onTabChange={setCurrentTab}
            currentTab={currentTab}
          />
          
          <SidebarInset className="flex-1">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">My Dashboard</h1>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6">
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <UserDashboardOverview
                    userStats={userStats}
                    notifications={notifications}
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="bookings">
                  <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <UserDashboardBookings
                    bookings={bookings}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                  />
                </TabsContent>

                <TabsContent value="profile">
                  <UserDashboardProfile
                    profile={user}
                    onProfileUpdate={refreshProfile}
                  />
                </TabsContent>
              </Tabs>
            </main>
          </SidebarInset>
        </div>

        {showPhoneModal && (
          <PhoneModal
            onClose={() => {
              // Only allow closing if user already has phone or is not a new user
              const isNewUser = sessionStorage.getItem('isNewGoogleUser');
              if (isNewUser === 'true' && !profile?.phone) {
                toast({
                  title: "Phone Number Required",
                  description: "Please add your phone number to continue using RP Cars.",
                  variant: "destructive",
                });
                return;
              }
              setShowPhoneModal(false);
            }}
            onComplete={handlePhoneModalComplete}
            isFirstTimeSetup={sessionStorage.getItem('isNewGoogleUser') === 'true'}
          />
        )}

        {shouldOpenBooking && selectedCarForBooking && (
          <Suspense fallback={<LoadingFallback />}>
            <EnhancedBookingFlow
              car={selectedCarForBooking}
              onClose={() => {
                setShouldOpenBooking(false);
                setSelectedCarForBooking(null);
              }}
              onBookingSuccess={() => {
                refetch();
                setShouldOpenBooking(false);
                setSelectedCarForBooking(null);
              }}
            />
          </Suspense>
        )}
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default UserDashboard;
