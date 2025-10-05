#!/usr/bin/env node

// Script to generate Supabase types
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase URL or Anon Key environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateTypes() {
  console.log('🔄 Generating Supabase types...');
  
  try {
    // Fetch schema information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
      process.exit(1);
    }

    console.log('📋 Found tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Generate TypeScript types manually based on our schema
    const typesContent = `// Generated Supabase types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          created_at: string | null
          price_in_paise: number | null
          currency: string | null
          booking_status: string | null
          booked_by: string | null
          booked_at: string | null
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
          created_at?: string | null
          price_in_paise?: number | null
          currency?: string | null
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
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
          created_at?: string | null
          price_in_paise?: number | null
          currency?: string | null
          booking_status?: string | null
          booked_by?: string | null
          booked_at?: string | null
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
      bookings: {
        Row: {
          id: string
          car_id: string | null
          user_id: string | null
          start_datetime: string
          end_datetime: string
          total_amount: number | null
          total_amount_in_paise: number | null
          currency: string | null
          status: string
          payment_id: string | null
          created_at: string | null
          hold_expires_at: string | null
        }
        Insert: {
          id?: string
          car_id?: string | null
          user_id?: string | null
          start_datetime: string
          end_datetime: string
          total_amount?: number | null
          total_amount_in_paise?: number | null
          currency?: string | null
          status?: string
          payment_id?: string | null
          created_at?: string | null
          hold_expires_at?: string | null
        }
        Update: {
          id?: string
          car_id?: string | null
          user_id?: string | null
          start_datetime?: string
          end_datetime?: string
          total_amount?: number | null
          total_amount_in_paise?: number | null
          currency?: string | null
          status?: string
          payment_id?: string | null
          created_at?: string | null
          hold_expires_at?: string | null
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
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          license_number: string | null
          license_expiry: string | null
          created_at: string | null
          is_admin: boolean | null
          // Added suspension columns
          is_suspended: boolean | null
          suspension_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          license_number?: string | null
          license_expiry?: string | null
          created_at?: string | null
          is_admin?: boolean | null
          // Added suspension columns
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          license_number?: string | null
          license_expiry?: string | null
          created_at?: string | null
          is_admin?: boolean | null
          // Added suspension columns
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          booking_id: string | null
          amount: number | null
          amount_in_paise: number | null
          currency: string | null
          status: string
          payment_method: string | null
          transaction_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          amount?: number | null
          amount_in_paise?: number | null
          currency?: string | null
          status?: string
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string | null
          amount?: number | null
          amount_in_paise?: number | null
          currency?: string | null
          status?: string
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
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
    CompositeTypes: {
      [_ in never]: never
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
`;

    // Write the types to the file
    writeFileSync('src/integrations/supabase/types.ts', typesContent);
    console.log('✅ Supabase types generated successfully at src/integrations/supabase/types.ts');
    
  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    process.exit(1);
  }
}

// Run the generation
generateTypes();