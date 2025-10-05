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
          // Added fields from migrations
          total_amount_in_paise: number | null
          currency: string | null
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
          // Added fields from migrations
          total_amount_in_paise?: number | null
          currency?: string | null
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
          // Added fields from migrations
          total_amount_in_paise?: number | null
          currency?: string | null
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
          // Added fields from migrations
          booking_status: string | null
          booked_by: string | null
          booked_at: string | null
          price_in_paise: number | null
          currency: string | null
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
          // Added fields from migrations
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
          price_in_paise?: number | null
          currency?: string | null
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
          // Added fields from migrations
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
          price_in_paise?: number | null
          currency?: string | null
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
          // Added fields from migrations
          amount_in_paise: number | null
          currency: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          gateway?: string | null
          provider_transaction_id?: string | null
          amount?: number | null
          status?: string | null
          created_at?: string
          // Added fields from migrations
          amount_in_paise?: number | null
          currency?: string | null
        }
        Update: {
          id?: string
          booking_id?: string | null
          gateway?: string | null
          provider_transaction_id?: string | null
          amount?: number | null
          status?: string | null
          created_at?: string
          // Added fields from migrations
          amount_in_paise?: number | null
          currency?: string | null
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
          // Added suspension columns
          is_suspended: boolean | null
          suspension_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          license_path?: string | null
          license_verified?: boolean | null
          // Added suspension columns
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          license_path?: string | null
          license_verified?: boolean | null
          // Added suspension columns
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
        }
      }
    }
    Views: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
    }
    Functions: {
      [key: string]: {
        Args: any;
        Returns: any;
      };
    }
    Enums: {
      [key: string]: any;
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never