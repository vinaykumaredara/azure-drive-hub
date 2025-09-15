import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  price_per_day: number;
  price_per_hour: number;
  image_urls: string[];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  car,
}) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingHold, setBookingHold] = useState(null);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);

  // Calculate total cost
  const calculateTotal = () => {
    if (!car || !startDate || !endDate) {return 0;}
    
    const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`);
    const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`);
    const hours = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    
    // Use daily rate if booking is for full days, otherwise hourly
    if (hours >= 24 && hours % 24 === 0) {
      return days * car.price_per_day;
    } else {
      return hours * (car.price_per_hour || car.price_per_day / 24);
    }
  };

  // Hold countdown timer
  useEffect(() => {
    if (!holdExpiry) {return;}
    
    const timer = setInterval(() => {
      const now = new Date();
      if (now >= holdExpiry) {
        setBookingHold(null);
        setHoldExpiry(null);
        toast({
          title: "Booking Hold Expired",
          description: "Your booking hold has expired. Please try again.",
          variant: "destructive",
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [holdExpiry]);

  const formatTimeRemaining = () => {
    if (!holdExpiry) {return "";}
    
    const now = new Date();
    const remaining = holdExpiry.getTime() - now.getTime();
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const createBookingHold = async () => {
    if (!car || !user || !startDate || !endDate) {return;}

    setIsLoading(true);
    
    try {
      const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`);
      const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`);
      const totalAmount = calculateTotal();
      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes hold

      // Check for conflicts first
      const { data: conflicts } = await supabase
        .from("bookings")
        .select("id")
        .eq("car_id", car.id)
        .eq("status", "confirmed")
        .or(`start_datetime.lte.${endDateTime.toISOString()},end_datetime.gte.${startDateTime.toISOString()}`);

      if (conflicts && conflicts.length > 0) {
        throw new Error("This car is not available for the selected dates");
      }

      // Create booking with hold
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          car_id: car.id,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          total_amount: totalAmount,
          status: "pending",
          hold_expires_at: holdExpiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {throw error;}

      setBookingHold(booking);
      setHoldExpiry(holdExpiresAt);
      
      toast({
        title: "Booking Hold Created",
        description: "You have 10 minutes to complete payment.",
      });

    } catch (error) {
      console.error("Booking hold error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking hold",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async () => {
    if (!bookingHold) {return;}

    setIsLoading(true);

    try {
      // Create payment intent
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-payment-intent",
        {
          body: { bookingId: bookingHold.id, gateway: "stripe" }
        }
      );

      if (paymentError) {throw paymentError;}

      // Simulate payment processing (in real app, this would integrate with Stripe)
      toast({
        title: "Processing Payment",
        description: "Redirecting to payment processor...",
      });

      // Simulate successful payment after 2 seconds
      setTimeout(async () => {
        try {
          const { error: confirmError } = await supabase.functions.invoke(
            "confirm-payment",
            {
              body: { 
                payment_intent_id: paymentData.payment_intent_id,
                status: "succeeded" 
              }
            }
          );

          if (confirmError) {throw confirmError;}

          toast({
            title: "Payment Successful!",
            description: "Your booking has been confirmed.",
          });

          // Close modal and reset state
          setBookingHold(null);
          setHoldExpiry(null);
          onClose();

        } catch (error) {
          console.error("Payment confirmation error:", error);
          toast({
            title: "Payment Confirmation Failed",
            description: error.message || "Please contact support",
            variant: "destructive",
          });
        }
      }, 2000);

    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!car) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            Book {car.title}
          </DialogTitle>
        </DialogHeader>

        {/* Car Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {car.image_urls?.[0] && (
                <img
                  src={car.image_urls[0]}
                  alt={car.title}
                  className="w-20 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{car.title}</h3>
                <p className="text-muted-foreground">{car.make} {car.model}</p>
                <div className="flex gap-4 mt-2">
                  <Badge variant="outline">₹{car.price_per_day}/day</Badge>
                  <Badge variant="outline">₹{car.price_per_hour || Math.round(car.price_per_day / 24)}/hour</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Hold Status */}
        {bookingHold && holdExpiry && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Booking Hold Active
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">
                  Complete payment within: <strong>{formatTimeRemaining()}</strong>
                </span>
                <Button onClick={processPayment} disabled={isLoading} size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < (startDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Price Summary */}
        {startDate && endDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Fees</span>
                  <span>₹{Math.round(calculateTotal() * 0.18)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{Math.round(calculateTotal() * 1.18)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          {!bookingHold ? (
            <Button
              onClick={createBookingHold}
              disabled={!startDate || !endDate || !user || isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating Hold..." : "Reserve Car"}
            </Button>
          ) : (
            <Button
              onClick={processPayment}
              disabled={isLoading}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Complete Payment"}
            </Button>
          )}
        </div>

        {!user && (
          <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-800">
              Please sign in to make a booking
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};