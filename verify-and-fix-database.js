/**
 * Database Verification and Fix Script
 * This script verifies the database schema and applies fixes if needed
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to hardcoded for this demo project
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyAndFixDatabase() {
  console.log('🔍 Verifying database schema...');
  
  try {
    // Check if cars table exists
    const { data: carsTable, error: carsTableError } = await supabase
      .from('cars')
      .select('id')
      .limit(1);
    
    if (carsTableError) {
      console.error('❌ Cars table error:', carsTableError.message);
      return;
    }
    
    console.log('✅ Cars table exists');
    
    // Check if booking_status column exists
    try {
      const { data: columns, error: columnsError } = await supabase
        .rpc('execute_sql', {
          sql: `SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'cars' 
                AND column_name = 'booking_status'`
        });
      
      if (columnsError) {
        console.log('⚠️  Could not check booking_status column directly, trying alternative approach...');
        
        // Try to select booking_status column to see if it exists
        const { data: bookingStatusData, error: bookingStatusError } = await supabase
          .from('cars')
          .select('booking_status')
          .limit(1);
        
        if (bookingStatusError && bookingStatusError.message.includes('column "booking_status" does not exist')) {
          console.log('❌ booking_status column does not exist, adding it...');
          
          // Add booking_status column
          const { error: addColumnError } = await supabase
            .rpc('execute_sql', {
              sql: `ALTER TABLE public.cars 
                    ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
                    ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
                    ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;`
            });
          
          if (addColumnError) {
            console.error('❌ Failed to add booking_status column:', addColumnError.message);
          } else {
            console.log('✅ Successfully added booking_status column');
            
            // Update existing cars to have booking_status = 'available'
            const { error: updateError } = await supabase
              .rpc('execute_sql', {
                sql: `UPDATE public.cars 
                      SET booking_status = 'available' 
                      WHERE booking_status IS NULL;`
              });
            
            if (updateError) {
              console.error('❌ Failed to update existing cars:', updateError.message);
            } else {
              console.log('✅ Successfully updated existing cars with booking_status');
            }
          }
        } else if (bookingStatusError) {
          console.error('❌ Error checking booking_status column:', bookingStatusError.message);
        } else {
          console.log('✅ booking_status column exists');
        }
      } else if (columns && columns.length > 0) {
        console.log('✅ booking_status column exists');
      } else {
        console.log('❌ booking_status column does not exist, adding it...');
        
        // Add booking_status column
        const { error: addColumnError } = await supabase
          .rpc('execute_sql', {
            sql: `ALTER TABLE public.cars 
                  ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'available',
                  ADD COLUMN IF NOT EXISTS booked_by UUID REFERENCES public.users(id),
                  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;`
          });
        
        if (addColumnError) {
          console.error('❌ Failed to add booking_status column:', addColumnError.message);
        } else {
          console.log('✅ Successfully added booking_status column');
          
          // Update existing cars to have booking_status = 'available'
          const { error: updateError } = await supabase
            .rpc('execute_sql', {
              sql: `UPDATE public.cars 
                    SET booking_status = 'available' 
                    WHERE booking_status IS NULL;`
            });
          
          if (updateError) {
            console.error('❌ Failed to update existing cars:', updateError.message);
          } else {
            console.log('✅ Successfully updated existing cars with booking_status');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking booking_status column:', error.message);
    }
    
    // Check if audit_logs table exists
    const { data: auditLogsTable, error: auditLogsTableError } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1);
    
    if (auditLogsTableError) {
      console.log('❌ audit_logs table does not exist, creating it...');
      
      const { error: createTableError } = await supabase
        .rpc('execute_sql', {
          sql: `CREATE TABLE IF NOT EXISTS public.audit_logs (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  action TEXT NOT NULL,
                  description TEXT,
                  user_id UUID REFERENCES public.users(id),
                  metadata JSONB,
                  timestamp TIMESTAMPTZ DEFAULT NOW()
                );
                
                COMMENT ON TABLE public.audit_logs IS 'Audit log for tracking admin actions and system events';
                COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed';
                COMMENT ON COLUMN public.audit_logs.description IS 'Description of the action';
                COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
                COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional metadata about the action';
                COMMENT ON COLUMN public.audit_logs.timestamp IS 'When the action was performed';
                
                GRANT ALL ON public.audit_logs TO authenticated;`
        });
      
      if (createTableError) {
        console.error('❌ Failed to create audit_logs table:', createTableError.message);
      } else {
        console.log('✅ Successfully created audit_logs table');
      }
    } else {
      console.log('✅ audit_logs table exists');
    }
    
    // Check if users table has is_admin column
    try {
      const { data: userColumns, error: userColumnsError } = await supabase
        .rpc('execute_sql', {
          sql: `SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'is_admin'`
        });
      
      if (userColumnsError) {
        console.log('⚠️  Could not check is_admin column directly');
      } else if (userColumns && userColumns.length > 0) {
        console.log('✅ is_admin column exists in users table');
      } else {
        console.log('❌ is_admin column does not exist in users table, adding it...');
        
        const { error: addColumnError } = await supabase
          .rpc('execute_sql', {
            sql: `ALTER TABLE public.users 
                  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`
          });
        
        if (addColumnError) {
          console.error('❌ Failed to add is_admin column:', addColumnError.message);
        } else {
          console.log('✅ Successfully added is_admin column to users table');
        }
      }
    } catch (error) {
      console.error('❌ Error checking is_admin column:', error.message);
    }
    
    console.log('✅ Database verification and fixes completed');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
}

// Run the verification
verifyAndFixDatabase();