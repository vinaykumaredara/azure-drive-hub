import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking, UserStats, Notification, LicenseData } from '@/types/dashboard.types';
import { resolveCarImageUrl } from '@/utils/carImageUtils';
import { errorLogger } from '@/utils/errorLogger';
import { toast } from '@/hooks/use-toast';

export const useDashboardData = (userId: string | undefined) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all data in parallel for better performance
      const [bookingsResult, statsResult, licenseResult] = await Promise.all([
        // Fetch bookings with error handling
        supabase
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
          .order('created_at', { ascending: false })
          .then(result => {
            if (result.error) {
              console.error('Bookings fetch error:', result.error);
              return { data: [], error: result.error };
            }
            return result;
          }),

        // Fetch stats with error handling
        supabase
          .from('bookings')
          .select('total_amount, total_amount_in_paise, status, cars(make)')
          .eq('user_id', userId)
          .then(result => {
            if (result.error) {
              console.error('Stats fetch error:', result.error);
              return { data: [], error: result.error };
            }
            return result;
          }),

        // Fetch license with error handling
        supabase
          .from('licenses')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
          .then(result => {
            if (result.error && result.error.code !== 'PGRST116') {
              console.error('License fetch error:', result.error);
            }
            return result;
          })
      ]);

      // Process bookings
      if (bookingsResult.data && bookingsResult.data.length > 0) {
        const processedBookings = bookingsResult.data.map((booking: any) => {
          if (booking.cars) {
            let imageUrls: string[] = [];
            if (Array.isArray(booking.cars.image_urls) && booking.cars.image_urls.length > 0) {
              imageUrls = booking.cars.image_urls.map((url: string) => resolveCarImageUrl(url));
            } else if (Array.isArray(booking.cars.image_paths) && booking.cars.image_paths.length > 0) {
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
        });
        
        setBookings(processedBookings);
      } else {
        setBookings([]);
      }

      // Process stats
      if (statsResult.data && statsResult.data.length > 0) {
        const totalBookings = statsResult.data.length;
        const totalSpent = statsResult.data.reduce((sum, booking: any) => {
          const amount = booking.total_amount_in_paise 
            ? booking.total_amount_in_paise / 100 
            : booking.total_amount;
          return sum + (amount || 0);
        }, 0);
        
        const carMakes = statsResult.data.map((b: any) => b.cars?.make).filter(Boolean);
        const favoriteCarType = carMakes.length > 0 
          ? carMakes.sort((a: string, b: string) => 
              carMakes.filter((v: string) => v === a).length - carMakes.filter((v: string) => v === b).length
            ).pop() || 'N/A'
          : 'N/A';
        
        const membershipLevel = totalSpent > 1000 ? 'Gold' : totalSpent > 500 ? 'Silver' : 'Bronze';
        const loyaltyPoints = Math.floor(totalSpent / 10);
        const co2Saved = totalBookings * 2.3;
        
        setUserStats({
          totalBookings,
          totalSpent,
          favoriteCarType,
          membershipLevel,
          loyaltyPoints,
          co2Saved
        });
      } else {
        // Set default stats for new users
        setUserStats({
          totalBookings: 0,
          totalSpent: 0,
          favoriteCarType: 'N/A',
          membershipLevel: 'Bronze',
          loyaltyPoints: 0,
          co2Saved: 0
        });
      }

      // Generate notifications
      const generatedNotifications: Notification[] = [];
      
      if (!licenseResult.data) {
        generatedNotifications.push({
          id: 1,
          title: 'Upload Your License',
          message: 'Upload your driving license to start booking cars',
          type: 'warning',
          time: 'Pending',
          created_at: new Date().toISOString()
        });
      } else {
        const license = licenseResult.data as LicenseData;
        if (license.verified === null) {
          generatedNotifications.push({
            id: 2,
            title: 'License Under Review',
            message: 'Your license is being verified. This usually takes 1-2 hours.',
            type: 'info',
            time: new Date(license.created_at).toLocaleDateString(),
            created_at: license.created_at
          });
        } else if (license.verified === true) {
          generatedNotifications.push({
            id: 3,
            title: 'License Verified!',
            message: 'Your driving license has been verified. You can now book cars.',
            type: 'success',
            time: new Date(license.created_at).toLocaleDateString(),
            created_at: license.created_at
          });
        }
      }

      // Check for upcoming bookings
      if (bookingsResult.data && bookingsResult.data.length > 0) {
        const now = new Date();
        const upcomingBookings = bookingsResult.data.filter((booking: any) => {
          const bookingDate = new Date(booking.start_datetime);
          const diffTime = bookingDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 2;
        });

        upcomingBookings.forEach((booking: any, index: number) => {
          const bookingDate = new Date(booking.start_datetime);
          const diffTime = bookingDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const carTitle = booking.cars?.title || 'a car';
          
          generatedNotifications.push({
            id: 4 + index,
            title: 'Upcoming Booking',
            message: `Your booking for ${carTitle} starts ${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`}`,
            type: 'info',
            time: bookingDate.toLocaleDateString(),
            created_at: booking.created_at || new Date().toISOString()
          });
        });
      }

      if (generatedNotifications.length === 0) {
        generatedNotifications.push({
          id: 5,
          title: 'Welcome to Azure Drive Hub!',
          message: 'Explore our premium fleet and start your journey',
          type: 'success',
          time: 'Welcome',
          created_at: new Date().toISOString()
        });
      }

      setNotifications(generatedNotifications);

    } catch (error: any) {
      errorLogger.logError(error as Error, {
        component: 'useDashboardData',
        action: 'fetchDashboardData',
        userId
      });
      
      console.error('Dashboard data fetch error:', error);
      
      toast({
        title: "Error Loading Dashboard",
        description: "Some data may not be available. Please refresh the page.",
        variant: "destructive",
      });

      // Set minimal default state to prevent crashes
      setBookings([]);
      setUserStats({
        totalBookings: 0,
        totalSpent: 0,
        favoriteCarType: 'N/A',
        membershipLevel: 'Bronze',
        loyaltyPoints: 0,
        co2Saved: 0
      });
      setNotifications([{
        id: 1,
        title: 'Error Loading Data',
        message: 'Please refresh the page to try again',
        type: 'warning',
        time: 'Now',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    bookings,
    userStats,
    notifications,
    isLoading,
    refetch: fetchDashboardData
  };
};
