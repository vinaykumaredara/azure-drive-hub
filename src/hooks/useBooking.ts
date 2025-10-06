import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/hooks/use-toast";

interface BookingDraft {
  carId: string;
  pickup: {
    date: string;
    time: string;
  };
  return: {
    date: string;
    time: string;
  };
  addons: Record<string, boolean>;
  totals: {
    subtotal: number;
    serviceCharge: number;
    total: number;
  };
}

interface SaveDraftOptions {
  redirectToProfile?: boolean;
}

export const useBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingBooking, setPendingBooking] = useState<BookingDraft | null>(null);

  // Check for pending booking on component mount
  useEffect(() => {
    const draftRaw = sessionStorage.getItem('pendingBooking');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setPendingBooking(draft);
      } catch (error) {
        console.error("Failed to parse pending booking:", error);
        sessionStorage.removeItem('pendingBooking');
      }
    }
  }, []);

  const saveDraftAndRedirect = (draft: BookingDraft, options: SaveDraftOptions = {}) => {
    // Save booking draft to session storage
    sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
    
    // Add debug logging
    console.log('saveDraftAndRedirect called:', { draft, options });
    
    // Set flags in sessionStorage for post-login handling
    if (options.redirectToProfile) {
      sessionStorage.setItem('redirectToProfileAfterLogin', 'true');
    }
    
    // Redirect to login with return URL (single-level param only)
    navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
  };

  const clearDraft = () => {
    sessionStorage.removeItem('pendingBooking');
    sessionStorage.removeItem('redirectToProfileAfterLogin');
    setPendingBooking(null);
  };

  const checkLicenseStatus = async () => {
    if (!user) {return false;}

    try {
      // Check if user has uploaded a license and if it's verified
      const { data: licenses, error } = await supabase
        .from('licenses')
        .select('id, verified')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {throw error;}

      // Return true if user has at least one verified license
      return licenses && licenses.length > 0 && (licenses[0] as any).verified;
    } catch (error) {
      console.error("License check error:", error);
      toast({
        title: "Error",
        description: "Failed to check license status",
        variant: "destructive",
      });
      return false;
    }
  };

  const createBookingHold = async (draft: BookingDraft, payMode: "full" | "hold") => {
    if (!user) {
      saveDraftAndRedirect(draft);
      return null;
    }

    // Add defensive validation client-side before calling server
    if (!draft.carId || !draft.pickup?.date || !draft.pickup?.time || !draft.return?.date || !draft.return?.time) {
      const error = new Error("Missing required booking information. Please fill in all date and time fields.");
      console.error("Create booking hold validation error:", error);
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    try {
      // Call Edge Function to create booking hold
      const { data, error } = await supabase.functions.invoke('create-hold', {
        body: {
          carId: draft.carId,
          pickup: draft.pickup,
          return: draft.return,
          addons: draft.addons,
          totals: draft.totals,
          payMode
        }
      });

      if (error) {throw error;}

      if (!data.success) {
        throw new Error(data.error || "Failed to create booking hold");
      }

      toast({
        title: "Booking Hold Created",
        description: payMode === "hold" 
          ? "Your booking is reserved for 24 hours. Complete payment within this time." 
          : "Booking created successfully.",
      });

      return data;
    } catch (error: any) {
      console.error("Create booking hold error:", error);
      const errorMessage = error?.message || "Failed to create booking. Please try again.";
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    pendingBooking,
    saveDraftAndRedirect,
    clearDraft,
    checkLicenseStatus,
    createBookingHold
  };
};