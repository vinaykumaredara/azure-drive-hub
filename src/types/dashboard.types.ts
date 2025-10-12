// Type definitions for dashboard components
import { Database } from '@/integrations/supabase/types';

export type Booking = Database['public']['Tables']['bookings']['Row'] & {
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
};

export interface UserStats {
  totalBookings: number;
  totalSpent: number;
  favoriteCarType: string;
  membershipLevel: string;
  loyaltyPoints: number;
  co2Saved: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  time: string;
  created_at: string;
}

export interface LicenseData {
  id: string;
  user_id: string;
  verified: boolean | null;
  created_at: string;
}
