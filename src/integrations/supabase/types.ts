export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          action: string
          description: string | null
          user_id: string | null
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          action: string
          description?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          action?: string
          description?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string | null
          car_id: string | null
          start_datetime: string
          end_datetime: string
          status: string
          hold_expires_at: string | null
          total_amount: number | null
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          car_id?: string | null
          start_datetime: string
          end_datetime: string
          status?: string
          hold_expires_at?: string | null
          total_amount?: number | null
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          car_id?: string | null
          start_datetime?: string
          end_datetime?: string
          status?: string
          hold_expires_at?: string | null
          total_amount?: number | null
          payment_id?: string | null
          created_at?: string
        }
      }
      cars: {
        Row: {
          id: string
          title: string
          make: string | null
          model: string | null
          year: number | null
          seats: number | null
          fuel_type: string | null
          transmission: string | null
          price_per_day: number
          price_per_hour: number | null
          service_charge: number | null
          description: string | null
          location_city: string | null
          status: string | null
          image_urls: string[] | null
          image_paths: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          make?: string | null
          model?: string | null
          year?: number | null
          seats?: number | null
          fuel_type?: string | null
          transmission?: string | null
          price_per_day: number
          price_per_hour?: number | null
          service_charge?: number | null
          description?: string | null
          location_city?: string | null
          status?: string | null
          image_urls?: string[] | null
          image_paths?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          make?: string | null
          model?: string | null
          year?: number | null
          seats?: number | null
          fuel_type?: string | null
          transmission?: string | null
          price_per_day?: number
          price_per_hour?: number | null
          service_charge?: number | null
          description?: string | null
          location_city?: string | null
          status?: string | null
          image_urls?: string[] | null
          image_paths?: string[] | null
          created_at?: string | null
        }
      }
      complaints: {
        Row: {
          id: string
          user_id: string | null
          booking_id: string | null
          issue: string | null
          status: string | null
          admin_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          issue?: string | null
          status?: string | null
          admin_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          issue?: string | null
          status?: string | null
          admin_note?: string | null
          created_at?: string
        }
      }
      licenses: {
        Row: {
          id: string
          user_id: string | null
          storage_path: string | null
          ocr_text: string | null
          ocr_confidence: number | null
          expires_at: string | null
          verified: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          storage_path?: string | null
          ocr_text?: string | null
          ocr_confidence?: number | null
          expires_at?: string | null
          verified?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          storage_path?: string | null
          ocr_text?: string | null
          ocr_confidence?: number | null
          expires_at?: string | null
          verified?: boolean | null
          created_at?: string
        }
      }
      maintenance: {
        Row: {
          id: string
          car_id: string | null
          start_date: string
          end_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          car_id?: string | null
          start_date: string
          end_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string | null
          start_date?: string
          end_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string | null
          message: string | null
          attachments: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id?: string | null
          message?: string | null
          attachments?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string | null
          message?: string | null
          attachments?: string[] | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string | null
          gateway: string | null
          provider_transaction_id: string | null
          amount: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          gateway?: string | null
          provider_transaction_id?: string | null
          amount?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          gateway?: string | null
          provider_transaction_id?: string | null
          amount?: number | null
          status?: string | null
          created_at?: string
        }
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_percent: number | null
          discount_flat: number | null
          valid_from: string | null
          valid_to: string | null
          active: boolean | null
          usage_limit: number | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_percent?: number | null
          discount_flat?: number | null
          valid_from?: string | null
          valid_to?: string | null
          active?: boolean | null
          usage_limit?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_percent?: number | null
          discount_flat?: number | null
          valid_from?: string | null
          valid_to?: string | null
          active?: boolean | null
          usage_limit?: number | null
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          key: string
          value: Json | null
          updated_at: string | null
        }
        Insert: {
          key: string
          value?: Json | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: Json | null
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          is_admin: boolean | null
          created_at: string | null
          license_path: string | null
          license_verified: boolean | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          license_path?: string | null
          license_verified?: boolean | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          license_path?: string | null
          license_verified?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}