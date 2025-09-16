import { supabase } from '@/integrations/supabase/client';

/**
 * Convert existing prices from USD to INR
 * @param exchangeRate - USD to INR exchange rate (e.g., 83.00)
 */
async function convertPricesToINR(exchangeRate: number = 83.00) {
  console.log(`Converting prices to INR using exchange rate: ${exchangeRate}`);
  
  try {
    // Convert car prices
    console.log('Converting car prices...');
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, price_per_day');
      
    if (carsError) {
      console.error('Error fetching cars:', carsError);
      return;
    }
    
    // Update each car with price_in_paise
    for (const car of cars) {
      const priceInINR = car.price_per_day * exchangeRate;
      const priceInPaise = Math.round(priceInINR * 100);
      
      const { error: updateError } = await supabase
        .from('cars')
        .update({ 
          price_in_paise: priceInPaise,
          currency: 'INR'
        })
        .eq('id', car.id);
        
      if (updateError) {
        console.error(`Error updating car ${car.id}:`, updateError);
      } else {
        console.log(`Updated car ${car.id}: $${car.price_per_day} -> ₹${priceInINR.toFixed(2)} (${priceInPaise} paise)`);
      }
    }
    
    // Convert booking amounts
    console.log('Converting booking amounts...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount');
      
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }
    
    // Update each booking with total_amount_in_paise
    for (const booking of bookings) {
      if (booking.total_amount) {
        const amountInINR = booking.total_amount * exchangeRate;
        const amountInPaise = Math.round(amountInINR * 100);
        
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            total_amount_in_paise: amountInPaise,
            currency: 'INR'
          })
          .eq('id', booking.id);
          
        if (updateError) {
          console.error(`Error updating booking ${booking.id}:`, updateError);
        } else {
          console.log(`Updated booking ${booking.id}: $${booking.total_amount} -> ₹${amountInINR.toFixed(2)} (${amountInPaise} paise)`);
        }
      }
    }
    
    // Convert payment amounts
    console.log('Converting payment amounts...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount');
      
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return;
    }
    
    // Update each payment with amount_in_paise
    for (const payment of payments) {
      if (payment.amount) {
        const amountInINR = payment.amount * exchangeRate;
        const amountInPaise = Math.round(amountInINR * 100);
        
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            amount_in_paise: amountInPaise,
            currency: 'INR'
          })
          .eq('id', payment.id);
          
        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
        } else {
          console.log(`Updated payment ${payment.id}: $${payment.amount} -> ₹${amountInINR.toFixed(2)} (${amountInPaise} paise)`);
        }
      }
    }
    
    console.log('✅ Price conversion completed successfully!');
    
  } catch (error) {
    console.error('Error during price conversion:', error);
  }
}

// Run the conversion if this script is executed directly
if (require.main === module) {
  const exchangeRate = process.argv[2] ? parseFloat(process.argv[2]) : 83.00;
  convertPricesToINR(exchangeRate);
}

export default convertPricesToINR;