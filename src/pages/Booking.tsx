// src/pages/Booking.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, Fuel, Settings, ArrowLeft, AlertCircle, CheckCircle, Phone, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { CarTravelingLoader } from "@/components/LoadingAnimations";
import { toast } from "@/hooks/use-toast";
import { LazyPaymentGateway, LazyPromoCodeInput, LazyCarImageGallery } from "@/components/LazyComponents";
import { useBooking } from "@/hooks/useBooking";
import { LicenseUpload } from "@/components/LicenseUpload";
import { PaymentOptions } from "@/components/PaymentOptions";
import { HoldNotice } from "@/components/HoldNotice";

interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  fuel_type: string;
  transmission: string;
  price_per_day: number;
  price_per_hour?: number;
  service_charge?: number;
  description?: string;
  location_city?: string;
  status: string;
  image_urls: string[];
  created_at: string;
}

const BookingPage: React.FC = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, profileLoading } = useAuth();
  const { pendingBooking, clearDraft, createBookingHold } = useBooking();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [durationError, setDurationError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<'percent' | 'flat'>('percent');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "dates" | "license" | "terms" | "payment">("phone");
  const [payMode, setPayMode] = useState<"full" | "hold">("full");
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [licensePath, setLicensePath] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [_holdId, setHoldId] = useState<string | null>(null);

  // Fetch car details from Supabase
  const fetchCar = useCallback(async () => {
    if (!carId) {
      setError('No car ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .eq('status', 'active')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Car not found or not available');
        } else {
          throw fetchError;
        }
        return;
      }

      setCar(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch car details');
      toast({
        title: "Error",
        description: "Failed to load car details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [carId]);

  // Check for pending booking from session storage
  useEffect(() => {
    if (pendingBooking) {
      // Restore booking data
      setPickupDate(pendingBooking.pickup.date);
      setPickupTime(pendingBooking.pickup.time);
      setReturnDate(pendingBooking.return.date);
      setReturnTime(pendingBooking.return.time);
      clearDraft(); // Clear the draft from session storage
    }
  }, [pendingBooking, clearDraft]);

  // Save booking state to sessionStorage on every step
  useEffect(() => {
    const bookingState = {
      step,
      phoneNumber,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      licenseUploaded,
      licensePath,
      termsAccepted,
      payMode
    };
    sessionStorage.setItem('bookingState', JSON.stringify(bookingState));
  }, [step, phoneNumber, pickupDate, returnDate, pickupTime, returnTime, licenseUploaded, licensePath, termsAccepted, payMode]);

  // Load booking state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('bookingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setStep(state.step || "phone");
        setPhoneNumber(state.phoneNumber || "");
        setPickupDate(state.pickupDate || "");
        setReturnDate(state.returnDate || "");
        setPickupTime(state.pickupTime || "10:00");
        setReturnTime(state.returnTime || "18:00");
        setLicenseUploaded(state.licenseUploaded || false);
        setLicensePath(state.licensePath || null);
        setTermsAccepted(state.termsAccepted || false);
        setPayMode(state.payMode || "full");
      } catch (error) {
        console.error('Failed to parse booking state:', error);
        sessionStorage.removeItem('bookingState');
      }
    }
  }, []);

  // Initialize phone number from profile
  useEffect(() => {
    if (profile && profile.phone) {
      setPhoneNumber(profile.phone);
    }
  }, [profile]);

  // Check if user has phone number and set initial step
  // Also check for restored booking data
  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.phone) {
        // User has phone number, proceed to dates step
        setStep("dates");
      } else {
        // User doesn't have phone number, stay on phone step
        setStep("phone");
      }
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    fetchCar();
  }, [carId, fetchCar]);

  const calculateDuration = useCallback(() => {
    if (!pickupDate || !returnDate || !pickupTime || !returnTime) {return { hours: 0, days: 0, isValid: false, error: null };}
    
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
    
    if (returnDateTime <= pickupDateTime) {
      return { hours: 0, days: 0, isValid: false, error: "Return date/time must be after pickup date/time" };
    }
    
    const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Check minimum duration requirement
    if (diffHours < 12) {
      return { hours: diffHours, days: 0, isValid: false, error: "We provide cars only for a minimum of 12 hours or 24 hours." };
    }
    
    // Calculate billing hours - round up to next 12/24 hour increment
    let billingHours;
    if (diffHours <= 12) {
      billingHours = 12;
    } else if (diffHours <= 24) {
      billingHours = 24;
    } else {
      // For longer periods, calculate in full days (24-hour increments)
      billingHours = Math.ceil(diffHours / 24) * 24;
    }
    
    const billingDays = billingHours / 24;
    
    return { 
      hours: diffHours, 
      billingHours, 
      days: billingDays, 
      isValid: true, 
      error: null 
    };
  }, [pickupDate, returnDate, pickupTime, returnTime]);

  // Update validation when dates/times change
  useEffect(() => {
    const duration = calculateDuration();
    setDurationError(duration.error);
  }, [calculateDuration]);

  const calculateDays = () => {
    const duration = calculateDuration();
    return duration.isValid ? duration.days : 0;
  };

  const duration = calculateDuration();
  const days = calculateDays();
  const actualHours = duration.hours || 0;
  const billingHours = duration.billingHours || 0;
  const subtotal = car ? car.price_per_day * days : 0;
  const serviceCharge = car && car.service_charge ? car.service_charge : Math.round(subtotal * 0.05);
  const total = subtotal + serviceCharge;

  const handlePhoneSubmit = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    // Update user profile with phone number
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ phone: phoneNumber })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update phone number:', error);
        toast({
          title: "Error",
          description: "Failed to update phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Proceed to next step
      setStep("dates");
      toast({
        title: "Phone Number Saved",
        description: "Your phone number has been saved successfully",
      });
    }
  };

  const handleLicenseUpload = (filePath: string) => {
    setLicensePath(filePath);
    setLicenseUploaded(true);
  };

  const handleCreateBooking = async () => {
    if (!carId || !pickupDate || !returnDate || !pickupTime || !returnTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!licenseUploaded) {
      toast({
        title: "License Required",
        description: "Please upload your driver's license",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create booking draft
      const draft = {
        carId,
        pickup: { date: pickupDate, time: pickupTime },
        return: { date: returnDate, time: returnTime },
        addons: {},
        totals: { subtotal, serviceCharge, total }
      };

      // Call the new transactional booking function
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          carId,
          pickup: { date: pickupDate, time: pickupTime },
          return: { date: returnDate, time: returnTime },
          addons: {},
          totals: { subtotal, serviceCharge, total },
          payMode,
          licensePath
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to create booking");

      // Clear booking state from sessionStorage
      sessionStorage.removeItem('bookingState');
      sessionStorage.removeItem('pendingBooking');
      
      // Show success message
      toast({
        title: "Booking Created",
        description: payMode === "hold" 
          ? "Your booking is reserved for 24 hours. Complete payment within this time." 
          : "Booking created successfully. Please proceed with payment.",
      });

      // Navigate to success page or payment page
      if (payMode === "hold") {
        navigate(`/booking-success/${data.bookingId}`);
      } else {
        // For full payment, open payment modal
        setIsPaymentModalOpen(true);
      }
    } catch (error: any) {
      console.error("Booking creation error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <CarTravelingLoader message="Loading car details..." />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Car Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || "The car you're looking for is not available or doesn't exist."}
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate("/")} className="w-full">
                  Browse Available Cars
                </Button>
                <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                  Go Back
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={() => navigate("/")} 
            variant="ghost" 
            className="mb-4"
          >
            ← Back to Cars
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Car Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gradient">Book Your Car</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <LazyCarImageGallery
                    images={car.image_urls}
                    carTitle={`${car.make} ${car.model}`}
                    aspectRatio="video"
                    showThumbnails={true}
                    interactive={true}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold">{car.title}</h3>
                  <p className="text-sm text-muted-foreground">{car.make} {car.model} ({car.year})</p>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {car.location_city || 'Hyderabad'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{car.seats} seats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-4 h-4 text-muted-foreground" />
                    <span>{car.fuel_type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>{car.transmission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === "phone" && "Phone Number"}
                  {step === "dates" && "Select Dates & Times"}
                  {step === "license" && "Upload License"}
                  {step === "terms" && "Terms & Conditions"}
                  {step === "payment" && "Payment Options"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === "phone" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Phone Number Required</p>
                          <p className="text-sm text-blue-700 mt-1">
                            We need your phone number to contact you about your booking.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-lg"
                      />
                    </div>
                    
                    <Button 
                      onClick={handlePhoneSubmit}
                      className="w-full"
                      disabled={!phoneNumber}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === "dates" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickup-date">Pickup Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="pickup-date"
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pickup-time">Pickup Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="pickup-time"
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="return-date">Return Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="return-date"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            min={pickupDate || new Date().toISOString().split('T')[0]}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="return-time">Return Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="return-time"
                            type="time"
                            value={returnTime}
                            onChange={(e) => setReturnTime(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {durationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Invalid Duration</p>
                            <p className="text-sm text-red-700 mt-1">
                              {durationError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {duration.isValid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Duration Confirmed</p>
                            <p className="text-sm text-green-700 mt-1">
                              {days} days ({Math.round(actualHours)} hours)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep("phone")}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep("license")}
                        disabled={!duration.isValid}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {step === "license" && (
                  <div className="space-y-6">
                    <LicenseUpload 
                      onLicenseUpload={handleLicenseUpload}
                      existingLicense={null}
                    />
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep("dates")}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep("terms")}
                        disabled={!licenseUploaded}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {step === "terms" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Booking Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal ({days} days)</span>
                          <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge</span>
                          <span>₹{serviceCharge.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Payment Options</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={payMode === "hold" ? "default" : "outline"}
                          onClick={() => setPayMode("hold")}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <div className="font-semibold">10% Hold</div>
                          <div className="text-xs mt-1">
                            ₹{Math.round(total * 0.1).toLocaleString('en-IN')} now
                          </div>
                          <div className="text-xs mt-1 text-muted-foreground">
                            Hold for 24 hours
                          </div>
                        </Button>
                        <Button
                          variant={payMode === "full" ? "default" : "outline"}
                          onClick={() => setPayMode("full")}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <div className="font-semibold">Full Payment</div>
                          <div className="text-xs mt-1">
                            ₹{total.toLocaleString('en-IN')} now
                          </div>
                          <div className="text-xs mt-1 text-muted-foreground">
                            Confirm booking
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I accept the{' '}
                        <button 
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => window.open('/terms', '_blank')}
                        >
                          Terms & Conditions
                        </button>
                      </Label>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep("license")}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleCreateBooking}
                        disabled={!termsAccepted || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Booking"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <LazyPaymentGateway 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={total}
          currency="INR"
          onPaymentSuccess={(paymentId) => {
            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed.",
            });
            navigate(`/booking-success/${paymentId}`);
          }}
          onPaymentError={(error) => {
            toast({
              title: "Payment Failed",
              description: error,
              variant: "destructive",
            });
          }}
        />
      )}
    </div>
  );
};

export default BookingPage;