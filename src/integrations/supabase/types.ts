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
          seats: number | null
          status: string | null
          title: string
          transmission: string | null
          year: number | null
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
          seats?: number | null
          status?: string | null
          title: string
          transmission?: string | null
          year?: number | null
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
          seats?: number | null
          status?: string | null
          title?: string
          transmission?: string | null
          year?: number | null
        }
        Relationships: []
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
          booking_id: string | null
          created_at: string | null
          gateway: string | null
          id: string
          provider_transaction_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          gateway?: string | null
          id?: string
          provider_transaction_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
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
          usage_limit?: number | null
          valid_from?: string | null
          valid_to?: string | null
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
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
