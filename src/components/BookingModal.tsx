import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, CreditCard, AlertCircle, FileText, Car, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageCarousel from '@/components/ImageCarousel';
import "./modal.css";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isLoading, setIsLoading] = useState(false);
interface BookingHold {
  id: string;
  car_id: string | null;
  user_id: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_amount: number | null;
  total_amount_in_paise: number | null;
  currency: string | null;
  payment_id: string | null;
  created_at: string | null;
  hold_expires_at: string | null;
}

const [bookingHold, setBookingHold] = useState<BookingHold | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [step, setStep] = useState(1); // 1: dates, 2: license, 3: payment
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Check for pending booking in session storage on mount
  useEffect(() => {
    if (isOpen && user) {
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const draft = JSON.parse(pendingBooking);
          // Restore form state from draft
          if (draft.carId === car?.id) {
            setStartDate(draft.startDate ? new Date(draft.startDate) : undefined);
            setEndDate(draft.endDate ? new Date(draft.endDate) : undefined);
            setStartTime(draft.startTime || "10:00");
            setEndTime(draft.endTime || "18:00");
            setLicenseId(draft.licenseId || null);
            setStep(draft.step || 1);
          }
          sessionStorage.removeItem('pendingBooking');
        } catch (_e) {
          // Silently fail - invalid draft data
        }
      }
    }
  }, [isOpen, user, car?.id]);

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

  const handleContinue = () => {
    // Check authentication
    if (!user) {
      // Save current state and redirect to login
      const draft = {
        carId: car?.id,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        startTime,
        endTime,
        licenseId,
        step
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
      navigate(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Validate current step
    if (step === 1) {
      if (!startDate || !endDate) {
        toast({
          title: "Validation Error",
          description: "Please select both start and end dates",
          variant: "destructive",
        });
        return;
      }
      
      if (startDate >= endDate) {
        toast({
          title: "Validation Error",
          description: "End date must be after start date",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (step === 2) {
      if (!licenseId) {
        toast({
          title: "License Required",
          description: "Please upload your driver's license before continuing",
          variant: "destructive",
        });
        return;
      }
    }

    // Move to next step
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
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
      const bookingData = {
        user_id: user.id,
        car_id: car.id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        total_amount: totalAmount,
        status: "pending",
        hold_expires_at: holdExpiresAt.toISOString(),
      };

      // Type assertion to avoid TypeScript errors with Supabase client typing
      const { data: booking, error } = await (supabase.from("bookings") as any)
        .insert([bookingData])
        .select()
        .single();

      if (error) {throw error;}

      setBookingHold(booking);
      setHoldExpiry(holdExpiresAt);
      
      toast({
        title: "Booking Hold Created",
        description: "You have 10 minutes to complete payment.",
      });

    } catch (error: any) {
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
          setStep(1);
          onClose();
        } catch (confirmError: any) {
          toast({
            title: "Payment Failed",
            description: confirmError.message || "Failed to confirm payment",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const _handleLicenseUploaded = (id: string) => {
    setLicenseId(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setStep(1);
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Book {car?.title || 'Car'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 120px)' }}
        >
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Select Dates & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                            disabled={!startDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => !startDate || date < startDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="start-time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {startDate && endDate && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Total Duration</p>
                            <p className="text-sm text-muted-foreground">
                              {format(startDate, "MMM d")} to {format(endDate, "MMM d")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{calculateTotal().toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
              
              {car && (
                <Card>
                  <CardHeader>
                    <CardTitle>Car Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        {car.image_urls && car.image_urls.length > 0 ? (
                          <ImageCarousel images={car.image_urls} className="h-full" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                            <Car className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{car.title}</h3>
                        <p className="text-muted-foreground">{car.make} {car.model}</p>
                        <p className="font-medium">₹{car.price_per_day.toLocaleString()}/day</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Driver's License
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Please upload your driver's license for verification. This is required before booking.
                  </p>
                  
                  {/* License upload component would go here */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload Your License</h3>
                    <p className="text-muted-foreground mb-4">
                      Take a clear photo of your driver's license or upload a PDF. We'll verify it before your booking.
                    </p>
                    <Button
                      onClick={() => {
                        // In a real implementation, this would open the license upload dialog
                        // For now, we'll simulate a successful upload
                        setLicenseId("simulated-license-id");
                        toast({
                          title: "License Uploaded",
                          description: "Your license has been uploaded successfully.",
                        });
                      }}
                    >
                      Upload License
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: JPG, PNG, PDF (max 5MB)
                    </p>
                  </div>
                  
                  {licenseId && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        License Uploaded
                      </Badge>
                      <span className="text-sm text-green-700">
                        Your license has been uploaded and is awaiting verification.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        // 10% hold payment
                        toast({
                          title: "10% Hold Selected",
                          description: "You will pay 10% now to hold the booking.",
                        });
                        createBookingHold();
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-2xl font-bold">10% Hold</div>
                      <div className="text-sm text-muted-foreground">
                        Pay ₹{(calculateTotal() * 0.1).toLocaleString()} now to hold
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pay remaining ₹{(calculateTotal() * 0.9).toLocaleString()} later
                      </div>
                    </Button>
                    
                    <Button
                      variant="default"
                      className="h-auto p-6 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        // Full payment
                        toast({
                          title: "Full Payment Selected",
                          description: "You will pay the full amount now.",
                        });
                        processPayment();
                      }}
                      disabled={isLoading}
                    >
                      <div className="text-2xl font-bold">Full Payment</div>
                      <div className="text-sm">
                        Pay ₹{calculateTotal().toLocaleString()} now
                      </div>
                      <div className="text-xs text-primary-foreground/80">
                        Get 5% discount on full payment
                      </div>
                    </Button>
                  </div>
                  
                  {holdExpiry && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="font-medium text-yellow-800">Booking Hold Active</p>
                              <p className="text-sm text-yellow-700">
                                Complete payment within {formatTimeRemaining()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={processPayment}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Pay Now"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Car:</span>
                      <span className="font-medium">{car?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dates:</span>
                      <span className="font-medium">
                        {startDate && endDate ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {startDate && endDate ? 
                          `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days` : 
                          ''}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-lg">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Sticky footer */}
        <div className="border-t p-4 bg-background sticky bottom-0">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
            >
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full ${
                      step === s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              
              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="ml-4"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : step === 3 ? (
                  "Complete Booking"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};