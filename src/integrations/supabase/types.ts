export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          action: string
          description: string | null
          user_id: string | null
          metadata: Json | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          action: string
          description?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          action?: string
          description?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          car_id: string | null
          created_at: string | null
          end_datetime: string
          hold_expires_at: string | null
          id: string
          payment_id: string | null
          start_datetime: string
          status: string
          total_amount: number | null
          total_amount_in_paise: number | null
          currency: string | null
          user_id: string | null
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          end_datetime: string
          hold_expires_at?: string | null
          id?: string
          payment_id?: string | null
          start_datetime: string
          status?: string
          total_amount?: number | null
          total_amount_in_paise?: number | null
          currency?: string | null
          user_id?: string | null
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          end_datetime?: string
          hold_expires_at?: string | null
          id?: string
          payment_id?: string | null
          start_datetime?: string
          status?: string
          total_amount?: number | null
          total_amount_in_paise?: number | null
          currency?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          created_at: string | null
          description: string | null
          fuel_type: string | null
          id: string
          image_urls: string[] | null
          location_city: string | null
          make: string | null
          model: string | null
          price_per_day: number
          price_per_hour: number | null
          price_in_paise: number | null
          currency: string | null
          seats: number | null
          status: string | null
          title: string
          transmission: string | null
          year: number | null
          // New fields for atomic booking
          booking_status: string | null
          booked_by: string | null
          booked_at: string | null
          // Service charge column
          service_charge: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          image_urls?: string[] | null
          location_city?: string | null
          make?: string | null
          model?: string | null
          price_per_day: number
          price_per_hour?: number | null
          price_in_paise?: number | null
          currency?: string | null
          seats?: number | null
          status?: string | null
          title: string
          transmission?: string | null
          year?: number | null
          // New fields for atomic booking
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
          // Service charge column
          service_charge?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          image_urls?: string[] | null
          location_city?: string | null
          make?: string | null
          model?: string | null
          price_per_day?: number
          price_per_hour?: number | null
          price_in_paise?: number | null
          currency?: string | null
          seats?: number | null
          status?: string | null
          title?: string
          transmission?: string | null
          year?: number | null
          // New fields for atomic booking
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
          // Service charge column
          service_charge?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      complaints: {
        Row: {
          admin_note: string | null
          booking_id: string | null
          created_at: string | null
          id: string
          issue: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          issue?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          issue?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ocr_confidence: number | null
          ocr_text: string | null
          storage_path: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_text?: string | null
          storage_path?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_text?: string | null
          storage_path?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          car_id: string | null
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          start_date: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          id: string
          message: string | null
          room_id: string
          sender_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          message?: string | null
          room_id: string
          sender_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          message?: string | null
          room_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          amount_in_paise: number | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          gateway: string | null
          id: string
          provider_transaction_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          amount_in_paise?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          gateway?: string | null
          id?: string
          provider_transaction_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          amount_in_paise?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          gateway?: string | null
          id?: string
          provider_transaction_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_flat: number | null
          discount_percent: number | null
          id: string
          last_used_at: string | null
          times_used: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_flat?: number | null
          discount_percent?: number | null
          id?: string
          last_used_at?: string | null
          times_used?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_flat?: number | null
          discount_percent?: number | null
          id?: string
          last_used_at?: string | null
          times_used?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          phone: string | null
          is_suspended: boolean | null
          suspension_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
          email: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          phone?: string | null
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          email?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          email?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_promo_code: {
        Args: { code_input: string }
        Returns: {
          discount_flat: number
          discount_percent: number
          message: string
          valid: boolean
        }[]
      }
      // New atomic booking function
      book_car_atomic: {
        Args: { car_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (DatabaseWithoutInternals["public"]["Tables"] & DatabaseWithoutInternals["public"]["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (DatabaseWithoutInternals["public"]["Tables"] &
      DatabaseWithoutInternals["public"]["Views"])
  ? (DatabaseWithoutInternals["public"]["Tables"] &
      DatabaseWithoutInternals["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
  ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
  ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Enums"]
  ? DatabaseWithoutInternals["public"]["Enums"][PublicEnumNameOrOptions]
  : never