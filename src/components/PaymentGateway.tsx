import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: {
      new (options: unknown): {
        open: () => void;
      };
    };
  }
}

interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    carId: string;
    carTitle: string;
    carImage: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    duration: {
      hours: number;
      days: number;
      billingHours: number;
    };
    subtotal: number;
    serviceCharge: number;
    total: number;
  };
  onSuccess: (bookingId: string) => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  isOpen,
  onClose,
  bookingData,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'stripe' | 'phonepe'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'failed'>('details');
  const [_bookingId, setBookingId] = useState<string | null>(null);

  const createBooking = async () => {
    try {
      const startDateTime = new Date(`${bookingData.startDate}T${bookingData.startTime}:00`);
      const endDateTime = new Date(`${bookingData.endDate}T${bookingData.endTime}:00`);

      const { data, error } = await (supabase
        .from('bookings') as any)
        .insert({
          user_id: user?.id,
          car_id: bookingData.carId,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          total_amount: bookingData.total,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {throw error;}
      return (data as any).id;
    } catch (_error) {
      console.error('Booking creation error:', _error);
      throw _error;
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(false);
      document.body.appendChild(script);
    });
  };

  const processRazorpayPayment = async (bookingId: string) => {
    try {
      await loadRazorpayScript();

      const { data: { session }, error } = await supabase.functions.invoke('create-payment', {
        body: {
          bookingId,
          gateway: 'razorpay',
          amount: bookingData.total
        }
      });

      if (error) {throw error;}

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_11111111111111', // Demo key
        amount: bookingData.total * 100, // Amount in paise
        currency: 'INR',
        name: 'Azure Drive Hub',
        description: `Car Rental: ${bookingData.carTitle}`,
        image: '/logo.png',
        order_id: session.sessionId,
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            // Confirm payment on backend
            const { error: confirmError } = await supabase.functions.invoke('confirm-payment', {
              body: {
                payment_intent_id: response.razorpay_payment_id,
                status: 'succeeded'
              }
            });

            if (confirmError) {throw confirmError;}

            setPaymentStep('success');
            setTimeout(() => {
              onSuccess(bookingId);
              onClose();
            }, 2000);
          } catch (error) {
            console.error('Payment confirmation error:', error);
            setPaymentStep('failed');
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          contact: user?.user_metadata?.phone || ''
        },
        notes: {
          booking_id: bookingId,
          car_id: bookingData.carId
        },
        theme: {
          color: '#3366FF'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStep('details');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  const processStripePayment = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          gateway: 'stripe'
        }
      });

      if (error) {throw error;}

      // For demo purposes, simulate successful payment
      setTimeout(async () => {
        try {
          const { error: confirmError } = await supabase.functions.invoke('confirm-payment', {
            body: {
              payment_intent_id: data.payment_intent_id,
              status: 'succeeded'
            }
          });

          if (confirmError) {throw confirmError;}

          setPaymentStep('success');
          setTimeout(() => {
            onSuccess(bookingId);
            onClose();
          }, 2000);
        } catch (error) {
          console.error('Payment confirmation error:', error);
          setPaymentStep('failed');
        }
      }, 3000);
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your booking",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('processing');

      // Create booking first
      const newBookingId = await createBooking();
      setBookingId(newBookingId);

      // Process payment based on selected gateway
      if (selectedGateway === 'razorpay') {
        await processRazorpayPayment(newBookingId);
      } else if (selectedGateway === 'stripe') {
        await processStripePayment(newBookingId);
      } else {
        // PhonePe placeholder - for now just show a message
        setTimeout(() => {
          setPaymentStep('failed');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStep('failed');
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Gateway Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Payment Method</Label>
        <div className="grid grid-cols-3 gap-3">
          <Card 
            className={`cursor-pointer transition-all ${selectedGateway === 'razorpay' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedGateway('razorpay')}
          >
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Razorpay</h3>
                <p className="text-xs text-muted-foreground">UPI, Cards, Net Banking</p>
                {selectedGateway === 'razorpay' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedGateway === 'stripe' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedGateway('stripe')}
          >
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Stripe</h3>
                <p className="text-xs text-muted-foreground">International Cards</p>
                {selectedGateway === 'stripe' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedGateway === 'phonepe' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            onClick={() => setSelectedGateway('phonepe')}
          >
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold">PhonePe</h3>
                <p className="text-xs text-muted-foreground">Coming Soon</p>
                {selectedGateway === 'phonepe' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <img
              src={bookingData.carImage}
              alt={bookingData.carTitle}
              className="w-20 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{bookingData.carTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {bookingData.startDate} {bookingData.startTime} → {bookingData.endDate} {bookingData.endTime}
              </p>
              <p className="text-sm text-primary font-medium">
                {bookingData.duration.billingHours} hours ({bookingData.duration.days} day{bookingData.duration.days !== 1 ? 's' : ''})
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{bookingData.subtotal.toLocaleString()}</span>
            </div>
            {bookingData.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹{bookingData.serviceCharge.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{bookingData.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-primary mb-1">Secure Payment Process</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Click "Pay Now" to proceed to {selectedGateway === 'razorpay' ? 'Razorpay' : selectedGateway === 'stripe' ? 'Stripe' : 'PhonePe'} secure checkout</li>
                <li>• Your booking will be confirmed after successful payment</li>
                <li>• You'll receive confirmation details via email</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="space-y-4">
        {/* Clear Payment Method Selection */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="w-4 h-4" />
            <span className="font-medium">
              {selectedGateway === 'razorpay' ? 'Razorpay' : selectedGateway === 'stripe' ? 'Stripe' : 'PhonePe'} selected
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedGateway === 'razorpay' 
              ? 'UPI, Cards, Net Banking & Wallets available'
              : selectedGateway === 'stripe'
              ? 'International cards accepted'
              : 'PhonePe integration coming soon'
            }
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold py-2 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isProcessing}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Now ₹{bookingData.total.toLocaleString()}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="text-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
      />
      <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
      <p className="text-muted-foreground">Please do not close this window...</p>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Check className="w-8 h-8 text-green-600" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
      <p className="text-muted-foreground">Your booking has been confirmed. Redirecting...</p>
    </div>
  );

  const renderFailedState = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <X className="w-8 h-8 text-red-600" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h3>
      <p className="text-muted-foreground mb-4">There was an issue processing your payment</p>
      <Button
        onClick={() => {
          setPaymentStep('details');
          setIsProcessing(false);
        }}
      >
        Try Again
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {paymentStep === 'details' && renderPaymentForm()}
        {paymentStep === 'processing' && renderProcessingState()}
        {paymentStep === 'success' && renderSuccessState()}
        {paymentStep === 'failed' && renderFailedState()}
      </DialogContent>
    </Dialog>
  );
};