// src/pages/Booking.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, Fuel, Settings, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
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
  make: string | null;
  model: string | null;
  year: number | null;
  seats: number | null;
  fuel_type: string | null;
  transmission: string | null;
  price_per_day: number;
  price_per_hour: number | null;
  service_charge: number | null;
  description: string | null;
  location_city: string | null;
  status: string | null;
  image_urls: string[] | null;
  image_paths: string[] | null;
  created_at: string | null;
  booked_at: string | null;
  booked_by: string | null;
  booking_status: string | null;
  currency: string | null;
  price_in_paise: number | null;
}

const BookingPage: React.FC = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { pendingBooking, clearDraft, createBookingHold } = useBooking();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [step, setStep] = useState<"dates" | "license" | "payment">("dates");
  const [payMode, setPayMode] = useState<"full" | "hold">("full");
  const [licenseUploaded, setLicenseUploaded] = useState(false);
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
        .or('status.eq.active,status.eq.published')
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
  const discountAmount = promoDiscountType === 'percent' 
    ? (subtotal * promoDiscount) / 100 
    : promoDiscount;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const serviceCharge = car?.service_charge || 0;
  const total = subtotalAfterDiscount + serviceCharge;

  const handleContinue = async () => {
    if (!duration.isValid) {
      toast({
        title: "Invalid Duration",
        description: duration.error || "Please check your booking dates and times",
        variant: "destructive",
      });
      return;
    }

    if (step === "dates") {
      if (!user) {
        // Save draft and redirect to login
        const draft = {
          carId: car?.id || "",
          pickup: { date: pickupDate, time: pickupTime },
          return: { date: returnDate, time: returnTime },
          addons: {},
          totals: { subtotal, serviceCharge, total }
        };
        sessionStorage.setItem('pendingBooking', JSON.stringify(draft));
        navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      
      // Move to license step
      setStep("license");
    } else if (step === "license") {
      // Move to payment step
      setStep("payment");
    }
  };

  const handleLicenseUpload = (_licenseId: string) => {
    setLicenseUploaded(true);
    toast({
      title: "License Uploaded",
      description: "Your license has been uploaded successfully.",
    });
  };

  const handleCreateHold = async () => {
    if (!car) {return;}

    const draft = {
      carId: car.id,
      pickup: { date: pickupDate, time: pickupTime },
      return: { date: returnDate, time: returnTime },
      addons: {},
      totals: { subtotal, serviceCharge, total }
    };

    const result = await createBookingHold(draft, payMode);
    
    if (result) {
      setHoldId(result.bookingId);
      if (payMode === "hold" && result.holdUntil) {
        setHoldExpiry(new Date(result.holdUntil));
      }
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = (_bookingId: string) => {
    toast({
      title: "Booking Confirmed!",
      description: "Your car has been successfully booked. Check your dashboard for details.",
    });
    navigate("/dashboard");
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
                    images={car.image_urls || []}
                    carTitle={`${car.make || ''} ${car.model || ''}`}
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
                  {step === "dates" && "Select Dates & Times"}
                  {step === "license" && "Upload License"}
                  {step === "payment" && "Payment Options"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === "dates" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickup-date">Pickup Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="pickup-date"
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="pl-10"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickup-time">Pickup Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="return-date">Return Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="return-date"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="pl-10"
                            min={pickupDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="return-time">Return Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

                    <Separator />

                    {/* Duration Validation Error */}
                    {durationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">{durationError}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Please select a minimum of 12 hours or 24 hours booking duration.
                        </p>
                      </div>
                    )}

                    {/* Duration Summary */}
                    {duration.isValid && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm space-y-1">
                          <p><strong>Actual Duration:</strong> {actualHours.toFixed(1)} hours</p>
                          <p><strong>Billing Duration:</strong> {billingHours} hours ({days} day{days !== 1 ? 's' : ''})</p>
                          {actualHours !== billingHours && (
                            <p className="text-blue-600 text-xs">
                              ℹ️ Rounded up to minimum {billingHours < 24 ? '12-hour' : '24-hour'} billing cycle
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Price Breakdown</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPromoCode(!showPromoCode)}
                          className="text-primary hover:text-primary/80"
                        >
                          <span className="mr-1">🎁</span>
                          Promo Code
                        </Button>
                      </div>
                      
                      {showPromoCode && (
                        <LazyPromoCodeInput
                          totalAmount={subtotal}
                          onPromoApplied={(discount, code, discountType) => {
                            setPromoDiscount(discount);
                            setPromoDiscountType(discountType || 'percent');
                            setAppliedPromoCode(code);
                          }}
                          onPromoRemoved={() => {
                            setPromoDiscount(0);
                            setPromoDiscountType('percent');
                            setAppliedPromoCode(null);
                          }}
                        />
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>₹{car.price_per_day.toLocaleString()} × {days} day{days > 1 ? 's' : ''}</span>
                          <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        {promoDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Promo Code Discount ({appliedPromoCode})</span>
                            <span>-₹{discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {serviceCharge > 0 && (
                          <div className="flex justify-between">
                            <span>Service Charge</span>
                            <span>₹{serviceCharge.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-primary">₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === "license" && (
                  <div className="space-y-4">
                    {!licenseUploaded ? (
                      <>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">License Required</p>
                              <p className="text-sm text-blue-700 mt-1">
                                Please upload a clear photo of your driver's license before proceeding to payment.
                              </p>
                            </div>
                          </div>
                        </div>
                        <LicenseUpload onUploaded={handleLicenseUpload} />
                      </>
                    ) : (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">License Uploaded Successfully</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Your license is uploaded and will be verified by our team.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step === "payment" && (
                  <div className="space-y-6">
                    {/* Promo Code Section */}
                    <div className="mb-4">
                      <LazyPromoCodeInput
                        totalAmount={subtotal}
                        onPromoApplied={(discount, code, type) => {
                          setPromoDiscount(discount);
                          setPromoDiscountType(type || 'percent');
                          setAppliedPromoCode(code);
                        }}
                        onPromoRemoved={() => {
                          setPromoDiscount(0);
                          setAppliedPromoCode(null);
                        }}
                      />
                    </div>

                    <PaymentOptions 
                      payMode={payMode}
                      onPayModeChange={setPayMode}
                      totalAmount={total}
                    />
                    
                    {holdExpiry && (
                      <HoldNotice 
                        holdExpiry={holdExpiry}
                        totalAmount={total}
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  {step !== "dates" && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step === "license" ? "dates" : "license")}
                    >
                      Back
                    </Button>
                  )}
                  
                  <Button
                    onClick={step === "payment" ? handleCreateHold : handleContinue}
                    className="ml-auto"
                    size="lg"
                    disabled={
                      step === "dates" && (!pickupDate || !returnDate || !duration.isValid) ||
                      step === "license" && !licenseUploaded
                    }
                  >
                    {step === "dates" && "Continue"}
                    {step === "license" && "Continue to Payment"}
                    {step === "payment" && "Proceed to Payment"}
                  </Button>
                </div>

                {!user && step === "dates" && (
                  <p className="text-sm text-muted-foreground text-center">
                    You need to sign in to complete your booking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Payment Gateway Modal */}
      <LazyPaymentGateway
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingData={{
          carId: car.id,
          carTitle: car.title,
          carImage: car.image_urls?.[0] || 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
          startDate: pickupDate,
          endDate: returnDate,
          startTime: pickupTime,
          endTime: returnTime,
          duration: {
            hours: actualHours,
            days,
            billingHours
          },
          subtotal,
          serviceCharge,
          total: Math.round(total)
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default BookingPage;