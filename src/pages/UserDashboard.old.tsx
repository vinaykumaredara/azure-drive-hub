import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Car, FileText, Settings, LogOut, User, CreditCard, Heart, MapPin, Clock, Star, Award, Bell, Download, Share2, Search, TrendingUp, Shield, Gift, Eye, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LicenseUpload } from '@/components/LicenseUpload';
import { EnhancedBookingFlow } from '@/components/EnhancedBookingFlow';
import { UserDashboardSidebar } from '@/components/UserDashboardSidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

import { errorLogger } from '@/utils/errorLogger';
import ImageCarousel from '@/components/ImageCarousel';
import { resolveCarImageUrl } from '@/utils/carImageUtils';
import { formatINRFromPaise } from '@/utils/currency';
import { PhoneModal } from '@/components/PhoneModal';
import { useBookingResume } from '@/hooks/useBookingResume';

interface Booking {
  id: string;
  car_id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_amount: number;
  total_amount_in_paise: number | null;
  payment_status: string | null;
  hold_amount: number | null;
  hold_until: string | null;
  created_at: string;
  cars?: {
    title: string;
    make: string;
    model: string;
    image_urls: string[];
    image_paths: string[];
    rating?: number;
  };
  licenses?: {
    id: string;
    verified: boolean | null;
  }[];
}

interface UserStats {
  totalBookings: number;
  totalSpent: number;
  favoriteCarType: string;
  membershipLevel: string;
  loyaltyPoints: number;
  co2Saved: number;
}

// Define types for Supabase responses
interface LicenseData {
  id: string;
  user_id: string;
  verified: boolean | null;
  created_at: string;
}

const UserDashboard: React.FC = () => {
  const { user, signOut, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resumedCar, isResuming, clearResumedCar } = useBookingResume();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteCarIds, setFavoriteCarIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<any>(null);
  const [shouldOpenBooking, setShouldOpenBooking] = useState(false);
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('overview');
  const bookingsRef = useRef<Booking[]>([]);

  // Handle resumed car from useBookingResume hook
  useEffect(() => {
    if (resumedCar && !showPhoneModal && !profileLoading) {
      console.debug('[UserDashboard] Resumed car detected', resumedCar);
      
      if (!profile?.phone) {
        console.debug('[UserDashboard] No phone, showing phone modal');
        setSelectedCarForBooking(resumedCar);
        setShowPhoneModal(true);
      } else {
        console.debug('[UserDashboard] Phone exists, opening booking');
        setSelectedCarForBooking(resumedCar);
        setShouldOpenBooking(true);
        clearResumedCar();
      }
    }
  }, [resumedCar, profile?.phone, showPhoneModal, profileLoading, clearResumedCar]);
  
  // Legacy: Handle booking restoration from sessionStorage (fallback)
  useEffect(() => {
    if (!user?.id || profileLoading) return;

    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      console.debug('[UserDashboard] Legacy sessionStorage booking detected');
      try {
        const draft = JSON.parse(pendingBooking);
        setRestoredDraft(draft);
        
        // Fetch car details
        const fetchCarForBooking = async () => {
          try {
            const { data: carData, error } = await supabase
              .from('cars')
              .select('*')
              .eq('id', draft.carId)
              .single();
            
            if (error) throw error;
            
            if (carData) {
              // Transform car data to match EnhancedBookingFlow props
              const carForBooking = {
                id: (carData as any).id,
                title: (carData as any).title,
                image: (carData as any).image_urls?.[0] || (carData as any).image_paths?.[0] || '',
                pricePerDay: (carData as any).price_per_day,
                price_in_paise: (carData as any).price_in_paise,
                seats: (carData as any).seats,
                fuel: (carData as any).fuel_type,
                transmission: (carData as any).transmission,
              };
              
              // Check if profile has phone number
              if (!profile?.phone) {
                console.debug('[UserDashboard] Legacy: No phone - showing phone modal');
                setShowPhoneModal(true);
                setSelectedCarForBooking(carForBooking);
              } else {
                // Phone exists, open booking flow immediately
                console.debug('[UserDashboard] Legacy: Phone exists - opening booking flow');
                setSelectedCarForBooking(carForBooking);
                setShouldOpenBooking(true);
              }
              
              // Clear legacy sessionStorage after processing
              sessionStorage.removeItem('pendingBooking');
            }
          } catch (error) {
            console.error('[UserDashboard] Failed to fetch car for booking:', error);
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
        console.error('[UserDashboard] Failed to parse pending booking:', error);
        sessionStorage.removeItem('pendingBooking');
      }
    }
  }, [user?.id, profile?.phone, profileLoading]);

  // Handle phone modal completion
  const handlePhoneModalComplete = async () => {
    console.debug('[UserDashboard] Phone modal completed, refreshing profile and opening booking');
    setShowPhoneModal(false);
    
    // Wait a moment for profile to refresh, then open booking flow
    setTimeout(() => {
      if (selectedCarForBooking) {
        console.debug('[UserDashboard] Opening booking after phone collection');
        setShouldOpenBooking(true);
      }
    }, 500);
  };

  // Move fetchNotifications outside useEffect so it can be called from other places
  const fetchNotifications = async (userId: string, signal: AbortSignal) => {
    console.log('fetchNotifications called for userId=', userId);
    try {
      // Generate dynamic notifications based on user data
      const notifications = [];
      
      // Check if user needs to upload license
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();
    
      if (licenseError && licenseError.code !== 'PGRST116') {
        throw licenseError;
      }

      if (!license) {
        notifications.push({
          id: 1,
          title: 'Upload Your License',
          message: 'Upload your driving license to start booking cars',
          type: 'warning',
          time: 'Pending',
          created_at: new Date().toISOString()
        });
      } else {
        const licenseData = license as LicenseData;
        if (licenseData.verified === null) {
          notifications.push({
            id: 2,
            title: 'License Under Review',
            message: 'Your license is being verified. This usually takes 1-2 hours.',
            type: 'info',
            time: new Date(licenseData.created_at).toLocaleDateString(),
            created_at: licenseData.created_at
          });
        } else if (licenseData.verified === true) {
          notifications.push({
            id: 3,
            title: 'License Verified!',
            message: 'Your driving license has been verified. You can now book cars.',
            type: 'success',
            time: new Date(licenseData.created_at).toLocaleDateString(),
            created_at: licenseData.created_at
          });
        }
      }
    
      // Check for recent bookings using the state
      if (bookings.length > 0) {
        const recentBooking = bookings[0];
        const bookingDate = new Date(recentBooking.start_datetime);
        const now = new Date();
        const diffTime = bookingDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
        if (diffDays >= 0 && diffDays <= 1) {
          notifications.push({
            id: 4,
            title: 'Upcoming Booking',
            message: `Your booking for ${recentBooking.cars?.title} starts ${diffDays === 0 ? 'today' : 'tomorrow'}`,
            type: 'info',
            time: bookingDate.toLocaleDateString(),
            created_at: recentBooking.created_at
          });
        }
      }
    
      // Add welcome message if no other notifications
      if (notifications.length === 0) {
        notifications.push({
          id: 5,
          title: 'Welcome to Azure Drive Hub!',
          message: 'Explore our premium fleet and start your journey',
          type: 'success',
          time: 'Welcome',
          created_at: new Date().toISOString()
        });
      }
    
      setNotifications(notifications);
    } catch (error: any) {
      if (error?.name === 'AbortError') {return;}
      console.error('Error in fetchNotifications:', error);
      // Fallback notification
      setNotifications([{
        id: 1,
        title: 'Welcome!',
        message: 'Welcome to Azure Drive Hub',
        type: 'info',
        time: 'Now',
        created_at: new Date().toISOString()
      }]);
    }
  };

  useEffect(() => {
    console.log('UserDashboard effect run:', { userId: user?.id });
    
    if (!user?.id) {return;}

    let mounted = true;
    const controller = new AbortController();

    const fetchUserBookings = async (userId: string, signal: AbortSignal) => {
      console.log('fetchUserBookings called for userId=', userId);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (
              title,
              make,
              model,
              image_urls,
              image_paths
            ),
            licenses (
              id,
              verified
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {throw error;}
        
        if (!mounted) {return;}

        // Process image URLs synchronously for better performance
        const processedBookings = data ? data.map((booking: any) => {
          if (booking.cars) {
            // Process image URLs synchronously
            let imageUrls: string[] = [];
            if (Array.isArray(booking.cars.image_urls) && booking.cars.image_urls.length > 0) {
              // Resolve all URLs synchronously
              imageUrls = booking.cars.image_urls.map((url: string) => resolveCarImageUrl(url));
            } else if (Array.isArray(booking.cars.image_paths) && booking.cars.image_paths.length > 0) {
              // Resolve paths to URLs synchronously
              imageUrls = booking.cars.image_paths.map((path: string) => resolveCarImageUrl(path));
            }
            
            return {
              ...booking,
              cars: {
                ...booking.cars,
                image_urls: imageUrls
              }
            };
          }
          return booking;
        }) : [];
        
        if (!mounted) {return;}
        setBookings(processedBookings || []);
      } catch (error: any) {
        if (error?.name === 'AbortError') {return;}
        errorLogger.logError(error as Error, {
          component: 'UserDashboard',
          action: 'fetchUserBookings',
          userId: userId
        });
        if (!mounted) {return;}
        toast({
          title: "Error",
          description: "Failed to load your bookings",
          variant: "destructive",
        });
      }
    };

    const fetchUserStats = async (userId: string, signal: AbortSignal) => {
      console.log('fetchUserStats called for userId=', userId);
      try {
        // Calculate user statistics
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select('total_amount, status, cars(make)')
          .eq('user_id', userId);
        
        if (error) {throw error;}
        
        if (!mounted) {return;}

        if (bookingsData) {
          const totalBookings = bookingsData.length;
          const totalSpent = bookingsData.reduce((sum, booking: any) => sum + (booking.total_amount || 0), 0);
          const carMakes = bookingsData.map((b: any) => b.cars?.make).filter(Boolean);
          const favoriteCarType = carMakes.length > 0 
            ? carMakes.sort((a: string, b: string) => 
                carMakes.filter((v: string) => v === a).length - carMakes.filter((v: string) => v === b).length
              ).pop() || 'N/A'
            : 'N/A';
          
          const membershipLevel = totalSpent > 1000 ? 'Gold' : totalSpent > 500 ? 'Silver' : 'Bronze';
          const loyaltyPoints = Math.floor(totalSpent / 10);
          const co2Saved = totalBookings * 2.3; // Estimated CO₂ saved per booking
          
          if (!mounted) {return;}
          setUserStats({
            totalBookings,
            totalSpent,
            favoriteCarType,
            membershipLevel,
            loyaltyPoints,
            co2Saved
          });
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {return;}
        console.error('Error fetching user stats:', error);
      }
    };

    const fetchNotifications = async (userId: string, signal: AbortSignal) => {
      console.log('fetchNotifications called for userId=', userId);
      try {
        // Generate dynamic notifications based on user data
        const notifications = [];
        
        // Check if user needs to upload license
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      
        if (licenseError && licenseError.code !== 'PGRST116') {
          throw licenseError;
        }
      
        if (!mounted) {return;}

        if (!license) {
          notifications.push({
            id: 1,
            title: 'Upload Your License',
            message: 'Upload your driving license to start booking cars',
            type: 'warning',
            time: 'Pending',
            created_at: new Date().toISOString()
          });
        } else {
          const licenseData = license as LicenseData;
          if (licenseData.verified === null) {
            notifications.push({
              id: 2,
              title: 'License Under Review',
              message: 'Your license is being verified. This usually takes 1-2 hours.',
              type: 'info',
              time: new Date(licenseData.created_at).toLocaleDateString(),
              created_at: licenseData.created_at
            });
          } else if (licenseData.verified === true) {
            notifications.push({
              id: 3,
              title: 'License Verified!',
              message: 'Your driving license has been verified. You can now book cars.',
              type: 'success',
              time: new Date(licenseData.created_at).toLocaleDateString(),
              created_at: licenseData.created_at
            });
          }
        }
      
        // Check for recent bookings
        if (bookings.length > 0) {
          const recentBooking = bookings[0];
          const bookingDate = new Date(recentBooking.start_datetime);
          const now = new Date();
          const diffTime = bookingDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
          if (diffDays >= 0 && diffDays <= 1) {
            notifications.push({
              id: 4,
              title: 'Upcoming Booking',
              message: `Your booking for ${recentBooking.cars?.title} starts ${diffDays === 0 ? 'today' : 'tomorrow'}`,
              type: 'info',
              time: bookingDate.toLocaleDateString(),
              created_at: recentBooking.created_at
            });
          }
        }
      
        // Add welcome message if no other notifications
        if (notifications.length === 0) {
          notifications.push({
            id: 5,
            title: 'Welcome to Azure Drive Hub!',
            message: 'Explore our premium fleet and start your journey',
            type: 'success',
            time: 'Welcome',
            created_at: new Date().toISOString()
          });
        }
      
        if (!mounted) {return;}
        setNotifications(notifications);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {return;}
        console.error('Error in fetchNotifications:', error);
        // Fallback notification
        if (!mounted) {return;}
        setNotifications([{
          id: 1,
          title: 'Welcome!',
          message: 'Welcome to Azure Drive Hub',
          type: 'info',
          time: 'Now',
          created_at: new Date().toISOString()
        }]);
      }
    };

    const fetchFavorites = async (userId: string) => {
      console.log('fetchFavorites called for userId=', userId);
      // For now, use local storage for favorites until user_favorites table is created
      try {
        const savedFavorites = localStorage.getItem(`favorites_${userId}`);
        if (savedFavorites) {
          if (!mounted) {return;}
          setFavoriteCarIds(JSON.parse(savedFavorites));
        } else {
          if (!mounted) {return;}
          setFavoriteCarIds([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        if (!mounted) {return;}
        setFavoriteCarIds([]);
      }
    };

    async function loadAll() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        // Only proceed if user exists
        if (!user?.id) return;
        
        // example: await Promise.all([fetchBookings({ userId: user.id, signal: controller.signal }), ...])
        await Promise.all([
          fetchUserBookings(user.id, controller.signal),
          fetchUserStats(user.id, controller.signal),
          fetchNotifications(user.id, controller.signal),
          fetchFavorites(user.id)
        ]);
      } catch (err: any) {
        if (err?.name === 'AbortError') {return;}
        console.error('UserDashboard loadAll error', err);
        toast({
          title: "Dashboard Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (mounted) {setIsLoading(false);}
      }
    }

    loadAll();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user?.id]); // ONLY depend on user?.id

  const toggleFavorite = (carId: string) => {
    const newFavorites = favoriteCarIds.includes(carId) 
      ? favoriteCarIds.filter(id => id !== carId)
      : [...favoriteCarIds, carId];
    
    setFavoriteCarIds(newFavorites);
    
    // Save to localStorage
    try {
      if (user?.id) {
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
    
    toast({
      title: "Favorites Updated",
      description: "Your favorite cars have been updated",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-primary text-primary-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success-foreground';
      case 'partial_hold':
        return 'bg-warning text-warning-foreground';
      case 'unpaid':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusText = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial_hold':
        return 'Advance Paid';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'Unknown';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'success': return <Gift className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.cars?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.cars?.make?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadBookingHistory = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Car,Start Date,End Date,Status,Amount\n" +
      bookings.map(b => 
        `"${b.cars?.title}",${b.start_datetime},${b.end_datetime},${b.status},${b.total_amount}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "booking_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Complete",
      description: "Your booking history has been downloaded",
    });
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: 'RP CARS Profile',
        text: `Check out my car rental profile! ${userStats?.totalBookings} bookings completed.`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation is now handled by the auth listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5">
        <header className="bg-white/90 backdrop-blur-xl border-b border-border/30 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent-purple rounded-xl flex items-center justify-center shadow-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">RP CARS</h1>
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <UserDashboardSidebar 
          onSignOut={handleSignOut}
          onTabChange={setCurrentTab}
          currentTab={currentTab}
        />
        
        {/* Main Content */}
        <SidebarInset className="flex-1">
          {/* Header with Sidebar Trigger */}
          <header className="bg-white/90 backdrop-blur-xl border-b border-border/30 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              
              <div className="flex items-center justify-between flex-1 flex-wrap gap-2">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
                      Welcome back!
                    </h1>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <Button variant="outline" onClick={shareProfile}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Profile
                  </Button>
                  <Button variant="outline" onClick={downloadBookingHistory}>
                    <Download className="h-4 w-4 mr-2" />
                    Download History
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent"
              >
                Welcome back!
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground"
              >
                {user?.email}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-2"
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadBookingHistory}
                className="border-border hover:bg-primary/5"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareProfile}
                className="border-border hover:bg-primary/5"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </motion.div>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6 sm:space-y-8">
            {/* Hide TabsList since sidebar handles navigation */}
            <div className="sr-only">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="licenses">Licenses</TabsTrigger>
                <TabsTrigger value="notifications">Alerts</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="space-y-6 sm:space-y-8 mt-0">
                {/* User Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-primary-light/5">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                            <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{userStats?.totalBookings || 0}</p>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">${userStats?.totalSpent || 0}</p>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-yellow-50">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                            <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">{userStats?.loyaltyPoints || 0}</p>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">CO₂ Saved</p>
                            <p className="text-2xl sm:text-3xl font-bold text-emerald-500 mt-1">{userStats?.co2Saved?.toFixed(1) || 0}kg</p>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Membership Level */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-1"
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          Membership Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Current Level</span>
                          <Badge 
                            variant="outline" 
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm"
                          >
                            {userStats?.membershipLevel || 'Bronze'}
                          </Badge>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span>Progress to next level</span>
                            <span className="font-medium">{Math.min(100, ((userStats?.totalSpent || 0) % 500) / 5)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(100, ((userStats?.totalSpent || 0) % 500) / 5)} 
                            className="h-2 sm:h-2.5 rounded-full" 
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Spend ${500 - ((userStats?.totalSpent || 0) % 500)} more to reach the next level!
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-primary to-accent-purple rounded-full flex items-center justify-center">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {bookings.slice(0, 4).length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {bookings.slice(0, 4).map((booking, index) => (
                              <motion.div 
                                key={booking.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm sm:text-base">
                                    Booked {booking.cars?.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(booking.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge className={`${getStatusColor(booking.status)} px-2 py-0.5 sm:px-3 sm:py-1 text-xs`} variant="secondary">
                                  {booking.status}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8">
                            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/30 mb-3 sm:mb-4" />
                            <p className="text-muted-foreground text-sm sm:text-base">No recent activity</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-4 sm:space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-primary to-accent-purple rounded-full flex items-center justify-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          My Bookings
                        </CardTitle>
                        <div className="flex gap-1 sm:gap-2">
                          <Button variant="outline" size="sm" onClick={downloadBookingHistory} className="border-border hover:bg-primary/5 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Export
                          </Button>
                          <Button variant="outline" size="sm" onClick={shareProfile} className="border-border hover:bg-primary/5 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3">
                            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search and Filter */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 py-4 sm:py-5 rounded-xl border-border focus-visible:ring-primary text-sm sm:text-base"
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full sm:w-[160px] rounded-xl py-4 sm:py-5 border-border text-sm sm:text-base">
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

                      {filteredBookings.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <Car className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-3 sm:mb-4" />
                          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                            {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your search'}
                          </h3>
                          <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                            {bookings.length === 0 
                              ? 'Start your first adventure with us' 
                              : 'Try adjusting your search or filter'}
                          </p>
                          <Button 
                            onClick={() => navigate('/')} 
                            className="bg-gradient-to-r from-primary to-accent-purple hover:from-primary/90 hover:to-accent-purple/90 text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
                          >
                            Browse Cars
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {filteredBookings.map((booking, index) => (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 border rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-muted/5 border-border"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden">
                                  {booking.cars?.image_urls && booking.cars.image_urls.length > 0 ? (
                                    <ImageCarousel images={booking.cars.image_urls} className="w-full h-full" />
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                      <Car className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-bold text-base sm:text-lg">
                                    {booking.cars?.title || 'Car Booking'}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>{booking.cars?.make} {booking.cars?.model}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>
                                        {new Date(booking.start_datetime).toLocaleDateString()} - {' '}
                                        {new Date(booking.end_datetime).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                    <span className="text-lg sm:text-xl font-bold text-primary">
                                      {booking.total_amount_in_paise 
                                        ? formatINRFromPaise(booking.total_amount_in_paise)
                                        : `₹${booking.total_amount?.toLocaleString()}`}
                                    </span>
                                    {booking.cars?.rating && (
                                      <div className="flex items-center gap-1 bg-yellow-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 fill-current" />
                                        <span className="text-xs font-medium">{booking.cars.rating}</span>
                                      </div>
                                    )}
                                    {booking.payment_status && (
                                      <Badge className={`${getPaymentStatusColor(booking.payment_status)} px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm`}>
                                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        {getPaymentStatusText(booking.payment_status)}
                                      </Badge>
                                    )}
                                    {booking.licenses && booking.licenses.length > 0 && (
                                      <Badge 
                                        className={`${
                                          booking.licenses.some(l => l.verified) 
                                            ? 'bg-success text-success-foreground' 
                                            : booking.licenses.some(l => l.verified === false)
                                              ? 'bg-destructive text-destructive-foreground'
                                              : 'bg-warning text-warning-foreground'
                                        } px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm`}
                                      >
                                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        {booking.licenses.some(l => l.verified) 
                                          ? 'License Verified' 
                                          : booking.licenses.some(l => l.verified === false)
                                            ? 'License Rejected'
                                            : 'License Pending'}
                                      </Badge>
                                    )}
                                    {booking.hold_until && booking.payment_status === 'partial_hold' && (
                                      <div className="flex items-center gap-1 text-warning text-xs sm:text-sm">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span>
                                          Hold until {new Date(booking.hold_until).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <Badge className={`${getStatusColor(booking.status)} px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm`} variant="secondary">
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                                <div className="flex gap-1 sm:gap-2">
                                  <Button variant="outline" size="sm" className="border-border hover:bg-primary/5 text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3">
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    View
                                  </Button>
                                  {booking.status === 'completed' && (
                                    <Button variant="outline" size="sm" className="border-border hover:bg-primary/5 text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3">
                                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      Rate
                                    </Button>
                                  )}
                                  {booking.status === 'pending' && booking.payment_status !== 'paid' && (
                                    <Button 
                                      size="sm" 
                                      className="text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3"
                                      onClick={() => navigate(`/booking/${booking.car_id}`)}
                                    >
                                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      Pay Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="favorites" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Heart className="h-4 w-4 text-white" />
                        </div>
                        Favorite Cars
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {favoriteCarIds.length === 0 ? (
                        <div className="text-center py-12">
                          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No favorite cars yet</h3>
                          <p className="text-muted-foreground mb-6">Start adding cars to your favorites to see them here</p>
                          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-primary to-accent-purple">
                            Browse Cars
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favoriteCarIds.map((carId, index) => (
                            <motion.div
                              key={carId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="border rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-muted/5"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold">Favorite Car #{index + 1}</h3>
                                  <p className="text-sm text-muted-foreground">Premium Vehicle</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => toggleFavorite(carId)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Heart className="h-5 w-5 fill-current" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        Notifications & Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notifications.length > 0 ? (
                        <div className="space-y-4">
                          {notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex items-start space-x-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors bg-gradient-to-r from-white to-muted/5"
                            >
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No notifications</h3>
                          <p className="text-muted-foreground">You're all caught up!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-purple rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          Profile Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent-purple flex items-center justify-center">
                              <User className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">User Profile</h3>
                              <p className="text-muted-foreground text-sm">Member since {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center pb-3 border-b border-border/50">
                              <span className="text-muted-foreground">Email</span>
                              <span className="font-medium">{user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-border/50">
                              <span className="text-muted-foreground">Member Since</span>
                              <span className="font-medium">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-border/50">
                              <span className="text-muted-foreground">Favorite Car Type</span>
                              <span className="font-medium">{userStats?.favoriteCarType}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Account Status</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Button className="w-full bg-gradient-to-r from-primary to-accent-purple hover:from-primary/90 hover:to-accent-purple/90">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Award className="h-6 w-6 text-yellow-600" />
                              </div>
                              <div>
                                <p className="font-semibold">First Booking</p>
                                <p className="text-xs text-muted-foreground">Completed your first rental</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-500 text-white">Earned</Badge>
                          </div>
                          
                          {(userStats?.totalBookings || 0) >= 5 && (
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Star className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">Frequent Renter</p>
                                  <p className="text-xs text-muted-foreground">5+ bookings completed</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-blue-500 text-white">Earned</Badge>
                            </div>
                          )}
                          
                          {(userStats?.totalSpent || 0) >= 1000 && (
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                  <CreditCard className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">Big Spender</p>
                                  <p className="text-xs text-muted-foreground">$1000+ total spent</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-purple-500 text-white">Earned</Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Shield className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold">Eco Warrior</p>
                                <p className="text-xs text-muted-foreground">Helped save {userStats?.co2Saved?.toFixed(1) || 0}kg CO₂</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-500 text-white">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="licenses" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-purple rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        Driver's Licenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LicenseUpload onUploaded={(licenseId) => {
                        console.log('License uploaded with ID:', licenseId);
                        toast({
                          title: "License Uploaded",
                          description: "Your license has been uploaded successfully.",
                        });
                        // License status will be reflected on next dashboard load
                      }} />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
          </main>
        </SidebarInset>
        
        {/* Modals */}
        {showPhoneModal && (
          <PhoneModal 
            onClose={() => setShowPhoneModal(false)} 
            onComplete={handlePhoneModalComplete} 
          />
        )}
        
        {/* Booking Modal */}
        {shouldOpenBooking && selectedCarForBooking && (
          <EnhancedBookingFlow
            car={selectedCarForBooking}
            onClose={() => {
              setShouldOpenBooking(false);
              setSelectedCarForBooking(null);
              // Clear the pending booking from sessionStorage
              sessionStorage.removeItem('pendingBooking');
            }}
            onBookingSuccess={() => {
              setShouldOpenBooking(false);
              setSelectedCarForBooking(null);
              sessionStorage.removeItem('pendingBooking');
              toast({
                title: "Booking Complete",
                description: "Your booking has been successfully completed!",
              });
              // Reload bookings to show the new one
              if (user?.id) {
                window.location.reload();
              }
            }}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
