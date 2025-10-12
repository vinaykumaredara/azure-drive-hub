import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PaymentStepProps {
  bookingError: string | null;
  advanceBooking: boolean;
  advanceAmount: number;
  totalAmount: number;
  extras: {
    driver: boolean;
    gps: boolean;
    childSeat: boolean;
    insurance: boolean;
  };
  onPaymentOptionChange: (isAdvance: boolean) => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  bookingError,
  advanceBooking,
  advanceAmount,
  totalAmount,
  extras,
  onPaymentOptionChange
}) => {
  const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
  const names = { driver: 'Driver', gps: 'GPS', childSeat: 'Child Seat', insurance: 'Insurance' };

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 sm:space-y-6"
    >
      {bookingError && (
        <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert" aria-live="assertive">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Booking Error</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {bookingError}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Need help? <a href="mailto:support@azuredrivehub.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      )}

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            {/* Full Payment Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                !advanceBooking 
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => onPaymentOptionChange(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPaymentOptionChange(false);
                }
              }}
              tabIndex={0}
              role="radio"
              aria-checked={!advanceBooking}
              aria-labelledby="full-payment-label"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="full-payment-label" className="font-medium">Pay Full Amount Now</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your booking with full payment
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </p>
                  {!advanceBooking && (
                    <Badge className="mt-1">Selected</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 10% Hold Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                advanceBooking 
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => onPaymentOptionChange(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPaymentOptionChange(true);
                }
              }}
              tabIndex={0}
              role="radio"
              aria-checked={advanceBooking}
              aria-labelledby="hold-payment-label"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="hold-payment-label" className="font-medium">Pay 10% to Hold</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay a 10% advance to hold booking for 24 hours
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    Pay 10% now to reserve this car for 24 hours. If full payment is not completed the hold will be released automatically.
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ₹{advanceAmount.toLocaleString('en-IN')}
                  </p>
                  {advanceBooking && (
                    <Badge className="mt-1">Selected</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
          <div className="flex justify-between text-sm">
            <span>Base rental</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          
          {Object.entries(extras).map(([key, enabled]) => {
            if (!enabled) {return null;}
            return (
              <div key={key} className="flex justify-between text-xs sm:text-sm">
                <span>{names[key as keyof typeof names]}</span>
                <span>₹{prices[key as keyof typeof prices]}</span>
              </div>
            );
          })}
          
          <Separator />
          <div className="flex justify-between font-bold text-base sm:text-lg">
            <span>Total Amount</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          
          {advanceBooking && (
            <div className="flex justify-between text-primary font-medium text-sm sm:text-base">
              <span>Advance Payment (10%)</span>
              <span>₹{advanceAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2 p-3 sm:p-4 bg-primary/5 rounded-lg">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <span className="text-xs sm:text-sm text-muted-foreground">
          Secure payment processing with PhonePe
        </span>
      </div>
    </motion.div>
  );
};