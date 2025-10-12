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
    if (!userId) return;

    setIsLoading(true);

    try {
      // Fetch all data in parallel for better performance
      const [bookingsResult, statsResult, licenseResult] = await Promise.all([
        // Fetch bookings
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
          .order('created_at', { ascending: false }),

        // Fetch stats
        supabase
          .from('bookings')
          .select('total_amount, total_amount_in_paise, status, cars(make)')
          .eq('user_id', userId),

        // Fetch license
        supabase
          .from('licenses')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      // Process bookings
      if (bookingsResult.data) {
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
      }

      // Process stats
      if (statsResult.data) {
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
        const recentBooking = bookingsResult.data[0];
        const bookingDate = new Date(recentBooking.start_datetime);
        const now = new Date();
        const diffTime = bookingDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
        if (diffDays >= 0 && diffDays <= 1) {
          const carTitle = recentBooking.cars?.title || 'a car';
          generatedNotifications.push({
            id: 4,
            title: 'Upcoming Booking',
            message: `Your booking for ${carTitle} starts ${diffDays === 0 ? 'today' : 'tomorrow'}`,
            type: 'info',
            time: bookingDate.toLocaleDateString(),
            created_at: recentBooking.created_at || new Date().toISOString()
          });
        }
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
      
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
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
