import { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Car {
  id: string;
  title: string;
  model: string;
  make?: string;
  year?: number;
  image: string;
  images?: string[];
  pricePerDay: number;
  location: string;
  fuel: string;
  transmission: string;
  seats: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  badges?: string[];
  thumbnail?: string;
  bookingStatus?: string;
  price_in_paise?: number;
  image_urls?: string[] | null;
  image_paths?: string[] | null;
  status?: string;
  isArchived?: boolean;
}

interface BookingData {
  car: Car;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  termsAccepted: boolean;
  licenseId: string | null;
  paymentChoice: 'full' | 'hold' | null;
}

export const useBookingFlow = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const { user, profile } = useAuth();

  const openBookingModal = useCallback((car: Car) => {
    // Check if user has phone number
    const phone = profile?.phone;
    
    if (!phone) {
      // Let the NewBookNowButton handle phone collection
      // Just return early without opening the modal
      return;
    }
    
    setBookingData({
      car,
      startDate: null,
      endDate: null,
      startTime: '10:00',
      endTime: '18:00',
      termsAccepted: false,
      licenseId: null,
      paymentChoice: null
    });
    setIsBookingModalOpen(true);
  }, [profile]);

  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setBookingData(null);
  }, []);

  const updateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData(prev => prev ? { ...prev, ...data } : null);
  }, []);

  const handleDateTimeSubmit = useCallback((startDate: Date, endDate: Date, startTime: string, endTime: string) => {
    if (!startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return false;
    }
    
    if (startDate >= endDate) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return false;
    }
    
    updateBookingData({ startDate, endDate, startTime, endTime });
    return true;
  }, [updateBookingData]);

  const handleTermsAccept = useCallback((accepted: boolean) => {
    if (!accepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed",
        variant: "destructive",
      });
      return false;
    }
    
    updateBookingData({ termsAccepted: accepted });
    return true;
  }, [updateBookingData]);

  const handleLicenseUpload = useCallback(async (file: File) => {
    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upload your license",
          variant: "destructive",
        });
        return null;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return null;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return null;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('license-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Create license record in database
      const { data: license, error: insertError } = await (supabase
        .from('licenses') as any)
        .insert({
          user_id: user.id,
          storage_path: filePath,
          verified: false
        })
        .select()
        .single();

      if (insertError) {
        // Rollback file upload if database insert fails
        await supabase.storage.from('license-uploads').remove([filePath]);
        throw insertError;
      }

      updateBookingData({ licenseId: filePath });
      
      toast({
        title: "License Uploaded",
        description: "Your license has been uploaded successfully.",
      });
      
      return filePath;
    } catch (error: any) {
      console.error('License upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, updateBookingData]);

  const handlePaymentSubmit = useCallback(async (paymentChoice: 'full' | 'hold') => {
    if (!bookingData) return false;
    
    if (!bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please select booking dates",
        variant: "destructive",
      });
      return false;
    }
    
    if (!bookingData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return false;
    }
    
    if (!bookingData.licenseId) {
      toast({
        title: "License Required",
        description: "Please upload your driver's license",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Call Edge Function to create booking
      const startDateTime = new Date(`${bookingData.startDate.toISOString().split('T')[0]}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.endDate.toISOString().split('T')[0]}T${bookingData.endTime}`);
      
      const { data, error } = await supabase.functions.invoke('create_booking', {
        body: {
          carId: bookingData.car.id,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          licenseUrl: bookingData.licenseId,
          paymentChoice
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to create booking");

      toast({
        title: "Booking Created",
        description: paymentChoice === 'hold' 
          ? "Your booking is reserved with a 10% hold. Complete payment within 24 hours." 
          : "Your booking has been confirmed successfully.",
      });

      closeBookingModal();
      return true;
    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [bookingData, closeBookingModal]);

  return {
    isBookingModalOpen,
    bookingData,
    openBookingModal,
    closeBookingModal,
    updateBookingData,
    handleDateTimeSubmit,
    handleTermsAccept,
    handleLicenseUpload,
    handlePaymentSubmit
  };
};