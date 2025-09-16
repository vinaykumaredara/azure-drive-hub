#!/usr/bin/env node

// Currency conversion script for PR 2
// This script converts existing USD prices to INR paise
// Usage: node scripts/convert-currency.js --rate=83.5

import { createClient } from '@supabase/supabase-js';

// Configuration - replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const rateArg = args.find(arg => arg.startsWith('--rate='));
const exchangeRate = rateArg ? parseFloat(rateArg.split('=')[1]) : null;

if (!exchangeRate) {
  console.error('❌ Error: Exchange rate is required');
  console.log('Usage: node scripts/convert-currency.js --rate=83.5');
  process.exit(1);
}

// Create Supabase client with service role key (full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function convertCurrency() {
  console.log(`💱 Starting currency conversion with exchange rate: 1 USD = ${exchangeRate} INR`);
  
  try {
    // Convert cars table
    console.log('\n🚗 Converting cars table...');
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, price_per_day, price_in_paise')
      .is('price_in_paise', null);

    if (carsError) {
      throw new Error(`Failed to fetch cars: ${carsError.message}`);
    }

    let carsUpdated = 0;
    for (const car of cars) {
      const priceInPaise = Math.round(car.price_per_day * exchangeRate * 100);
      const { error: updateError } = await supabase
        .from('cars')
        .update({ 
          price_in_paise: priceInPaise,
          currency: 'INR'
        })
        .eq('id', car.id);

      if (updateError) {
        console.warn(`⚠️  Failed to update car ${car.id}: ${updateError.message}`);
      } else {
        carsUpdated++;
      }
    }
    console.log(`✅ Updated ${carsUpdated} cars`);

    // Convert bookings table
    console.log('\n📅 Converting bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, total_amount_in_paise')
      .is('total_amount_in_paise', null);

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    let bookingsUpdated = 0;
    for (const booking of bookings) {
      const amountInPaise = Math.round(booking.total_amount * exchangeRate * 100);
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          total_amount_in_paise: amountInPaise,
          currency: 'INR'
        })
        .eq('id', booking.id);

      if (updateError) {
        console.warn(`⚠️  Failed to update booking ${booking.id}: ${updateError.message}`);
      } else {
        bookingsUpdated++;
      }
    }
    console.log(`✅ Updated ${bookingsUpdated} bookings`);

    // Convert payments table
    console.log('\n💳 Converting payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, amount_in_paise')
      .is('amount_in_paise', null);

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    let paymentsUpdated = 0;
    for (const payment of payments) {
      const amountInPaise = Math.round(payment.amount * exchangeRate * 100);
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          amount_in_paise: amountInPaise,
          currency: 'INR'
        })
        .eq('id', payment.id);

      if (updateError) {
        console.warn(`⚠️  Failed to update payment ${payment.id}: ${updateError.message}`);
      } else {
        paymentsUpdated++;
      }
    }
    console.log(`✅ Updated ${paymentsUpdated} payments`);

    console.log('\n🎉 Currency conversion completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   🚗 Cars updated: ${carsUpdated}`);
    console.log(`   📅 Bookings updated: ${bookingsUpdated}`);
    console.log(`   💳 Payments updated: ${paymentsUpdated}`);
    console.log(`   💰 All prices now stored in INR paise`);
    
  } catch (error) {
    console.error('\n❌ Currency conversion failed:', error.message);
    process.exit(1);
  }
}

// Run the conversion
if (import.meta.url === `file://${process.argv[1]}`) {
  convertCurrency();
}