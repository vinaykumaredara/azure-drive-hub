import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Car,
  Clock,
  FileText,
  LogOut,
  User,
  Heart,
  Award,
  Bell,
  Download,
  Share2,
  Search,
  Shield,
  Gift,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LicenseUpload } from '@/components/LicenseUpload';

import { errorLogger } from '@/utils/errorLogger';
import ImageCarousel from '@/components/ImageCarousel';
import { resolveCarImageUrl } from '@/utils/carImageUtils';
import { formatINRFromPaise } from '@/utils/currency';
import { PhoneModal } from '@/components/PhoneModal';

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
  // const _location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteCarIds, setFavoriteCarIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [_restoredDraft, _setRestoredDraft] = useState<any>(null);
  // const _bookingsRef = useRef<Booking[]>([]);

  // Handle booking restoration and phone collection after login
  useEffect(() => {
    // Add debug logging
    console.log('UserDashboard useEffect triggered:', {
      user,
      profile,
      profileLoading,
    });

    if (!user?.id) {
      return;
    }

    // Check if we need to restore a booking
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const draft = JSON.parse(pendingBooking);
        _setRestoredDraft(draft);

        // Wait for profile to load
        const checkProfile = async () => {
          // Wait for profile to load (max 5 seconds)
          let attempts = 0;
          while (profileLoading && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          // Check if profile has phone number
          if (!profile?.phone) {
            console.log('Showing phone modal to collect phone number');
            setShowPhoneModal(true);
          } else {
            // Phone exists, we can proceed with booking
            console.log('Phone exists, booking can proceed');
            // The actual booking restoration will be handled by the CarCard components
          }
        };

        checkProfile();
      } catch (error) {
        console.error('Failed to parse pending booking:', error);
        sessionStorage.removeItem('pendingBooking');
      }
    }
  }, [user?.id, profile, profileLoading, user]);

  // Handle phone modal completion
  const handlePhoneModalComplete = () => {
    console.log('Phone modal completed, booking can proceed');
    setShowPhoneModal(false);
    // The actual booking restoration will be handled by the CarCard components
  };

  // Move fetchNotifications outside useEffect so it can be called from other places
  const _fetchNotifications = async (userId: string, _signal: AbortSignal) => {
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
          created_at: new Date().toISOString(),
        });
      } else {
        const licenseData = license as LicenseData;
        if (licenseData.verified === null) {
          notifications.push({
            id: 2,
            title: 'License Under Review',
            message:
              'Your license is being verified. This usually takes 1-2 hours.',
            type: 'info',
            time: new Date(licenseData.created_at).toLocaleDateString(),
            created_at: licenseData.created_at,
          });
        } else if (licenseData.verified === true) {
          notifications.push({
            id: 3,
            title: 'License Verified!',
            message:
              'Your driving license has been verified. You can now book cars.',
            type: 'success',
            time: new Date(licenseData.created_at).toLocaleDateString(),
            created_at: licenseData.created_at,
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
            created_at: recentBooking.created_at,
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
          created_at: new Date().toISOString(),
        });
      }

      setNotifications(notifications);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Error in fetchNotifications:', error);
      // Fallback notification
      setNotifications([
        {
          id: 1,
          title: 'Welcome!',
          message: 'Welcome to Azure Drive Hub',
          type: 'info',
          time: 'Now',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    console.log('UserDashboard effect run:', { userId: user?.id });

    if (!user?.id) {
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    const fetchUserBookings = async (userId: string, _signal: AbortSignal) => {
      console.log('fetchUserBookings called for userId=', userId);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
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
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        // Process image URLs synchronously for better performance
        const processedBookings = data
          ? data.map((booking: any) => {
              if (booking.cars) {
                // Process image URLs synchronously
                let imageUrls: string[] = [];
                if (
                  Array.isArray(booking.cars.image_urls) &&
                  booking.cars.image_urls.length > 0
                ) {
                  // Resolve all URLs synchronously
                  imageUrls = booking.cars.image_urls.map((url: string) =>
                    resolveCarImageUrl(url)
                  );
                } else if (
                  Array.isArray(booking.cars.image_paths) &&
                  booking.cars.image_paths.length > 0
                ) {
                  // Resolve paths to URLs synchronously
                  imageUrls = booking.cars.image_paths.map((path: string) =>
                    resolveCarImageUrl(path)
                  );
                }

                return {
                  ...booking,
                  cars: {
                    ...booking.cars,
                    image_urls: imageUrls,
                  },
                };
              }
              return booking;
            })
          : [];

        if (!mounted) {
          return;
        }
        setBookings(processedBookings || []);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        errorLogger.logError(error as Error, {
          component: 'UserDashboard',
          action: 'fetchUserBookings',
          userId: userId,
        });
        if (!mounted) {
          return;
        }
        toast({
          title: 'Error',
          description: 'Failed to load your bookings',
          variant: 'destructive',
        });
      }
    };

    const fetchUserStats = async (userId: string, _signal: AbortSignal) => {
      console.log('fetchUserStats called for userId=', userId);
      try {
        // Calculate user statistics
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select('total_amount, status, cars(make)')
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        if (bookingsData) {
          const totalBookings = bookingsData.length;
          const totalSpent = bookingsData.reduce(
            (sum, booking: any) => sum + (booking.total_amount || 0),
            0
          );
          const carMakes = bookingsData
            .map((b: any) => b.cars?.make)
            .filter(Boolean);
          const favoriteCarType =
            carMakes.length > 0
              ? carMakes
                  .sort(
                    (a: string, b: string) =>
                      carMakes.filter((v: string) => v === a).length -
                      carMakes.filter((v: string) => v === b).length
                  )
                  .pop() || 'N/A'
              : 'N/A';

          const membershipLevel =
            totalSpent > 1000 ? 'Gold' : totalSpent > 500 ? 'Silver' : 'Bronze';
          const loyaltyPoints = Math.floor(totalSpent / 10);
          const co2Saved = totalBookings * 2.3; // Estimated CO₂ saved per booking

          if (!mounted) {
            return;
          }
          setUserStats({
            totalBookings,
            totalSpent,
            favoriteCarType,
            membershipLevel,
            loyaltyPoints,
            co2Saved,
          });
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Error fetching user stats:', error);
      }
    };

    const fetchNotifications = async (userId: string, _signal: AbortSignal) => {
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

        if (!mounted) {
          return;
        }

        if (!license) {
          notifications.push({
            id: 1,
            title: 'Upload Your License',
            message: 'Upload your driving license to start booking cars',
            type: 'warning',
            time: 'Pending',
            created_at: new Date().toISOString(),
          });
        } else {
          const licenseData = license as LicenseData;
          if (licenseData.verified === null) {
            notifications.push({
              id: 2,
              title: 'License Under Review',
              message:
                'Your license is being verified. This usually takes 1-2 hours.',
              type: 'info',
              time: new Date(licenseData.created_at).toLocaleDateString(),
              created_at: licenseData.created_at,
            });
          } else if (licenseData.verified === true) {
            notifications.push({
              id: 3,
              title: 'License Verified!',
              message:
                'Your driving license has been verified. You can now book cars.',
              type: 'success',
              time: new Date(licenseData.created_at).toLocaleDateString(),
              created_at: licenseData.created_at,
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
              created_at: recentBooking.created_at,
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
            created_at: new Date().toISOString(),
          });
        }

        if (!mounted) {
          return;
        }
        setNotifications(notifications);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Error in fetchNotifications:', error);
        // Fallback notification
        if (!mounted) {
          return;
        }
        setNotifications([
          {
            id: 1,
            title: 'Welcome!',
            message: 'Welcome to Azure Drive Hub',
            type: 'info',
            time: 'Now',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };

    const fetchFavorites = async (userId: string) => {
      console.log('fetchFavorites called for userId=', userId);
      // For now, use local storage for favorites until user_favorites table is created
      try {
        const savedFavorites = localStorage.getItem(`favorites_${userId}`);
        if (savedFavorites) {
          if (!mounted) {
            return;
          }
          setFavoriteCarIds(JSON.parse(savedFavorites));
        } else {
          if (!mounted) {
            return;
          }
          setFavoriteCarIds([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        if (!mounted) {
          return;
        }
        setFavoriteCarIds([]);
      }
    };

    async function loadAll() {
      if (!user?.id) {
        return;
      }

      try {
        setIsLoading(true);
        // Only proceed if user exists
        if (!user?.id) {
          return;
        }

        // example: await Promise.all([fetchBookings({ userId: user.id, signal: controller.signal }), ...])
        await Promise.all([
          fetchUserBookings(user.id, controller.signal),
          fetchUserStats(user.id, controller.signal),
          fetchNotifications(user.id, controller.signal),
          fetchFavorites(user.id),
        ]);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        console.error('UserDashboard loadAll error', err);
        toast({
          title: 'Dashboard Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user?.id, bookings]); // ONLY depend on user?.id

  const _toggleFavorite = (carId: string) => {
    const newFavorites = favoriteCarIds.includes(carId)
      ? favoriteCarIds.filter(id => id !== carId)
      : [...favoriteCarIds, carId];

    setFavoriteCarIds(newFavorites);

    // Save to localStorage
    try {
      if (user?.id) {
        localStorage.setItem(
          `favorites_${user.id}`,
          JSON.stringify(newFavorites)
        );
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }

    toast({
      title: 'Favorites Updated',
      description: 'Your favorite cars have been updated',
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
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      case 'success':
        return <Gift className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.cars?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.cars?.make?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadBookingHistory = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Car,Start Date,End Date,Status,Amount\n' +
      bookings
        .map(
          b =>
            `"${b.cars?.title}",${b.start_datetime},${b.end_datetime},${b.status},${b.total_amount}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'booking_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Complete',
      description: 'Your booking history has been downloaded',
    });
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: 'RP CARS Profile',
        text: `Check out my car rental profile! ${userStats?.totalBookings} bookings completed.`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Profile link copied to clipboard',
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
                    RP CARS
                  </h1>
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
    <div className="min-h-screen bg-background">
      <header className="bg-white/90 backdrop-blur-xl border-b border-border/30 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-gradient-to-r from-primary to-accent-purple rounded-xl flex items-center justify-center shadow-lg"
              >
                <Car className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
                  RP CARS
                </h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={shareProfile}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
              <Button variant="outline" onClick={downloadBookingHistory}>
                <Download className="h-4 w-4 mr-2" />
                Download History
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
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
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Bookings
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  {userStats?.totalBookings || 0}
                </p>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatINRFromPaise(userStats?.totalSpent || 0)}
                </p>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Membership
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  {userStats?.membershipLevel || 'Bronze'}
                </p>
              </div>
            </motion.div>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="bookings" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        No bookings
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by booking your first car.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => navigate('/')}>
                          Browse Cars
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBookings.map(booking => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                            {booking.cars?.image_urls &&
                              booking.cars.image_urls.length > 0 && (
                                <div className="relative h-48">
                                  <ImageCarousel
                                    images={booking.cars.image_urls}
                                  />
                                </div>
                              )}
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {booking.cars?.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.cars?.make} {booking.cars?.model}
                                  </p>
                                </div>
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1)}
                                </Badge>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Pickup
                                  </span>
                                  <span>
                                    {new Date(
                                      booking.start_datetime
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Return
                                  </span>
                                  <span>
                                    {new Date(
                                      booking.end_datetime
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Amount
                                  </span>
                                  <span className="font-medium">
                                    {formatINRFromPaise(booking.total_amount)}
                                  </span>
                                </div>
                                {booking.payment_status && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Payment
                                    </span>
                                    <Badge
                                      className={getPaymentStatusColor(
                                        booking.payment_status
                                      )}
                                    >
                                      {getPaymentStatusText(
                                        booking.payment_status
                                      )}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    // View booking details
                                    navigate(`/booking/${booking.id}`);
                                  }}
                                >
                                  View Details
                                </Button>
                                {booking.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      // Rebook same car
                                      navigate(`/car/${booking.car_id}`);
                                    }}
                                  >
                                    Rebook
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Your Favorite Cars</h2>
                  <p className="text-muted-foreground">
                    Cars you've marked as favorites will appear here.
                  </p>

                  {favoriteCarIds.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        No favorites yet
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Start browsing cars and mark your favorites.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => navigate('/')}>
                          Browse Cars
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Favorite cars would be displayed here */}
                      <p>Favorite cars loading...</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Notifications</h2>

                  {notifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        No notifications
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You're all caught up!
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map(notification => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                        >
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="profile" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Profile Settings</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Email
                            </label>
                            <div className="p-3 rounded-md bg-muted">
                              {user?.email}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Phone
                            </label>
                            <div className="p-3 rounded-md bg-muted">
                              {profile?.phone || 'Not provided'}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // Navigate to profile edit page
                              navigate('/profile');
                            }}
                          >
                            Edit Profile
                          </Button>
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
                            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-purple rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                            Security
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                              // Change password
                              try {
                                const { error } =
                                  await supabase.auth.resetPasswordForEmail(
                                    user?.email || ''
                                  );
                                if (error) {
                                  throw error;
                                }
                                toast({
                                  title: 'Password Reset',
                                  description:
                                    'Check your email for password reset instructions.',
                                });
                              } catch (error) {
                                console.error('Password reset error:', error);
                                toast({
                                  title: 'Error',
                                  description:
                                    'Failed to send password reset email.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            Change Password
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={async () => {
                              // Delete account
                              if (
                                window.confirm(
                                  'Are you sure you want to delete your account? This action cannot be undone.'
                                )
                              ) {
                                try {
                                  // Note: Supabase doesn't have a direct delete user method
                                  // This would need to be implemented on the backend
                                  toast({
                                    title: 'Account Deletion',
                                    description:
                                      'Account deletion request submitted. Check your email for confirmation.',
                                  });
                                } catch (error) {
                                  console.error(
                                    'Account deletion error:',
                                    error
                                  );
                                  toast({
                                    title: 'Error',
                                    description:
                                      'Failed to process account deletion request.',
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }}
                          >
                            Delete Account
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>

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
                          <LicenseUpload
                            onUploaded={licenseId => {
                              console.log(
                                'License uploaded with ID:',
                                licenseId
                              );
                              toast({
                                title: 'License Uploaded',
                                description:
                                  'Your license has been uploaded successfully.',
                              });
                              // License status will be reflected on next dashboard load
                            }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
      {showPhoneModal && (
        <PhoneModal
          onClose={() => setShowPhoneModal(false)}
          onComplete={handlePhoneModalComplete}
        />
      )}
    </div>
  );
};

export default UserDashboard;
