import { useState, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Car, 
  AlertCircle, 
  Phone, 
  FileText, 
  Shield, 
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatINRFromPaise } from '@/utils/currency';
import { LicenseUpload } from '@/components/LicenseUpload';
import { PaymentGateway } from '@/components/PaymentGateway';

interface EnhancedBookingFlowProps {
  car: {
    id: string;
    title: string;
    image: string;
    pricePerDay: number;
    price_in_paise?: number;
    seats: number;
    fuel: string;
    transmission: string;
  };
  onClose: () => void;
  onBookingSuccess: () => void;
}

type Step = 'dates' | 'phone' | 'extras' | 'terms' | 'license' | 'payment' | 'confirmation';

const stepIcons = {
  dates: Calendar,
  phone: Phone,
  extras: Car,
  terms: Shield,
  license: FileText,
  payment: CreditCard,
  confirmation: CheckCircle
};

const stepTitles = {
  dates: 'Select Dates & Times',
  phone: 'Phone Number',
  extras: 'Add Extras',
  terms: 'Terms & Conditions',
  license: 'Upload License',
  payment: 'Payment Details', 
  confirmation: 'Booking Confirmed'
};

export const EnhancedBookingFlow: React.FC<EnhancedBookingFlowProps> = ({ car, onClose, onBookingSuccess }) => {
  const [currentStep, setCurrentStep] = useState<Step>('dates');
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '10:00',
    endTime: '18:00',
    phoneNumber: '' as string | null,
    extras: {
      driver: false,
      gps: false,
      childSeat: false,
      insurance: true
    },
    totalDays: 1,
    holdId: null as string | null,
    holdExpiry: null as string | null,
    termsAccepted: false,
    licenseId: null as string | null,
    advanceBooking: false,
    advanceAmount: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const steps: Step[] = ['dates', 'phone', 'extras', 'terms', 'license', 'payment', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  // Handle body scroll locking for mobile
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch user phone number on component mount
  useEffect(() => {
    const fetchUserPhone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Cast to any to bypass TypeScript issues with Supabase generated types
          const { data: profile, error } = await (supabase
            .from('users') as any)
            .select('phone')
            .eq('id', user.id)
            .single();
            
          if (!error && profile && profile.phone) {
            setBookingData(prev => ({
              ...prev,
              phoneNumber: profile.phone
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user phone:', error);
      }
    };
    
    fetchUserPhone();
  }, []);

  const calculateTotal = () => {
    const basePrice = (car.price_in_paise ? car.price_in_paise / 100 : car.pricePerDay) * bookingData.totalDays;
    const extrasPrice = Object.entries(bookingData.extras).reduce((acc, [key, enabled]) => {
      if (!enabled) {return acc;}
      const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
      return acc + (prices[key as keyof typeof prices] || 0);
    }, 0);
    return basePrice + extrasPrice;
  };

  const calculateAdvanceAmount = () => {
    return Math.round(calculateTotal() * 0.1); // 10% advance
  };

  const _handleBookCar = async (advanceBooking = false) => {
    setIsLoading(true);
    setBookingError(null);
    
    try {
      // Save phone number if it's new or changed
      if (bookingData.phoneNumber) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Cast to any to bypass TypeScript issues with Supabase generated types
          const { error } = await (supabase
            .from('users') as any)
            .update({ phone: bookingData.phoneNumber } as any)
            .eq('id', user.id)
            .select();
            
          if (error) {
            console.error('Error updating phone number:', error);
          }
        }
      }
      
      // If advance booking, create a hold
      if (advanceBooking) {
        const advanceAmount = calculateAdvanceAmount();
        setBookingData(prev => ({
          ...prev,
          advanceBooking: true,
          advanceAmount
        }));
        
        // Here we would integrate with the payment gateway for advance payment
        // For now, we'll just simulate it
        setCurrentStep('confirmation');
        onBookingSuccess();
        return;
      }
      
      // Call the atomic booking function using raw SQL since it's not in the generated types
      // We need to cast to any to bypass TypeScript checking for custom RPC functions
      const { data, error } = await (supabase.rpc as any)('book_car_atomic', { car_id: car.id });

      if (error) {
        throw error;
      }

      // Check if booking was successful
      // Since the function returns JSONB, we need to parse it
      const result = data as { success: boolean; message: string };
      
      if (result && !result.success) {
        throw new Error(result.message);
      }

      // If successful, proceed to confirmation
      setCurrentStep('confirmation');
      onBookingSuccess();
      
      // Reset add-ons state after successful booking
      setBookingData(prev => ({
        ...prev,
        extras: {
          driver: false,
          gps: false,
          childSeat: false,
          insurance: true
        }
      }));
      
      toast({
        title: "Success",
        description: "Car booked successfully!",
      });
    } catch (error: unknown) {
      console.error('Booking error:', error);
      let errorMessage = 'Failed to book car. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setBookingError(errorMessage);
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 'dates') {
      // Validate dates
      if (!bookingData.startDate || !bookingData.endDate) {
        toast({
          title: "Validation Error",
          description: "Please select both start and end dates",
          variant: "destructive",
        });
        return;
      }
      
      // Validate that end date is after start date
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);
      
      if (endDate < startDate) {
        toast({
          title: "Validation Error",
          description: "Return date must be after pickup date",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate total days
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      setBookingData(prev => ({
        ...prev,
        totalDays: diffDays
      }));
      
      setCurrentStep('phone');
    } else if (currentStep === 'phone') {
      // Validate phone number
      if (!bookingData.phoneNumber) {
        toast({
          title: "Validation Error",
          description: "Please enter your phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Basic phone number validation (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(bookingData.phoneNumber.replace(/\D/g, ''))) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid 10-digit Indian phone number",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentStep('extras');
    } else if (currentStep === 'extras') {
      setCurrentStep('terms');
    } else if (currentStep === 'terms') {
      if (!bookingData.termsAccepted) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms and conditions to proceed",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep('license');
    } else if (currentStep === 'license') {
      if (!bookingData.licenseId) {
        toast({
          title: "License Required",
          description: "Please upload your driver's license to proceed",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      // Open payment gateway
      setIsPaymentOpen(true);
    }
    
    // Scroll to top when advancing to next step
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      // Scroll to top when going back
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLicenseUploaded = (licenseId: string) => {
    setBookingData(prev => ({
      ...prev,
      licenseId
    }));
  };

  const handlePaymentSuccess = (_bookingId: string) => {
    // Handle successful payment
    setCurrentStep('confirmation');
    onBookingSuccess();
    setIsPaymentOpen(false);
  };

  const renderDateSelection = () => (
    <motion.div
      key="dates"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="startDate" className="text-sm">Pickup Date</Label>
          <Input
            id="startDate"
            type="date"
            value={bookingData.startDate}
            onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
            className="mt-1 text-sm"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-sm">Return Date</Label>
          <Input
            id="endDate"
            type="date"
            value={bookingData.endDate}
            onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
            className="mt-1 text-sm"
            min={bookingData.startDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="startTime" className="text-sm">Pickup Time</Label>
          <Select value={bookingData.startTime} onValueChange={(value) => 
            setBookingData(prev => ({ ...prev, startTime: value }))
          }>
            <SelectTrigger className="mt-1 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={hour} value={`${hour}:00`} className="text-sm">
                    {hour}:00
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="endTime" className="text-sm">Return Time</Label>
          <Select value={bookingData.endTime} onValueChange={(value) => 
            setBookingData(prev => ({ ...prev, endTime: value }))
          }>
            <SelectTrigger className="mt-1 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={hour} value={`${hour}:00`} className="text-sm">
                    {hour}:00
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookingData.startDate && bookingData.endDate && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-4 bg-primary-light rounded-lg"
        >
          <p className="text-xs sm:text-sm font-medium text-primary">
            Total Duration: {bookingData.totalDays} day{bookingData.totalDays > 1 ? 's' : ''}
          </p>
          <p className="text-base sm:text-lg font-bold text-primary mt-1">
            {formatINRFromPaise((car.price_in_paise || car.pricePerDay * 100) * bookingData.totalDays)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );

  const renderPhoneCollection = () => (
    <motion.div
      key="phone"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Phone Number</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Please provide your phone number for booking confirmation
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="phoneNumber" className="text-sm">Phone Number</Label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground text-xs sm:text-sm">+91</span>
            </div>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="9876543210"
              value={bookingData.phoneNumber || ''}
              onChange={(e) => setBookingData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="pl-10 sm:pl-12 text-sm"
              maxLength={10}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            We'll use this for booking updates and verification
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderExtrasSelection = () => (
    <motion.div
      key="extras"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Add Extras</h3>
          <p className="text-sm text-muted-foreground">
            Enhance your rental experience
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Optional
        </Badge>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {Object.entries({
          driver: { name: 'Professional Driver', price: 500, desc: 'Experienced driver for your trip' },
          gps: { name: 'GPS Navigation', price: 200, desc: 'Built-in GPS with latest maps' },
          childSeat: { name: 'Child Safety Seat', price: 150, desc: 'Safety seat for children' },
          insurance: { name: 'Premium Insurance', price: 300, desc: 'Comprehensive coverage', recommended: true }
        }).map(([key, extra]) => (
          <Card key={key} className={`cursor-pointer transition-all hover:shadow-md ${
            bookingData.extras[key as keyof typeof bookingData.extras] 
              ? 'ring-2 ring-primary bg-primary-light/20' 
              : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{extra.name}</h4>
                    {extra.recommended && (
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{extra.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{extra.price}/day</p>
                  <Button
                    variant={bookingData.extras[key as keyof typeof bookingData.extras] ? "default" : "outline"}
                    size="sm"
                    className="mt-2"
                    onClick={() => setBookingData(prev => ({
                      ...prev,
                      extras: {
                        ...prev.extras,
                        [key]: !prev.extras[key as keyof typeof prev.extras]
                      }
                    }))}
                  >
                    {bookingData.extras[key as keyof typeof bookingData.extras] ? 'Added' : 'Add'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Percent className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">Advance Booking Option</h4>
              <p className="text-sm text-muted-foreground">
                Pay 10% upfront to reserve your car for later dates
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const advanceAmount = calculateAdvanceAmount();
                  setBookingData(prev => ({
                    ...prev,
                    advanceBooking: true,
                    advanceAmount
                  }));
                  toast({
                    title: "Advance Booking",
                    description: `Pay ₹${advanceAmount} now to reserve this car`,
                  });
                }}
              >
                Reserve with 10% Advance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderTermsAndConditions = () => (
    <motion.div
      key="terms"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Terms & Conditions</h3>
        <p className="text-muted-foreground">
          Please read and accept our rental terms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rental Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-48 overflow-y-auto">
          <div className="space-y-3 text-sm">
            <p><strong>1. Rental Period:</strong> The rental period begins at the specified pickup time and ends at the return time.</p>
            <p><strong>2. Fuel Policy:</strong> The vehicle will be provided with a full tank and must be returned with a full tank.</p>
            <p><strong>3. Insurance:</strong> Basic insurance is included. Additional coverage can be purchased.</p>
            <p><strong>4. Liability:</strong> The renter is responsible for all traffic violations and parking fines incurred during the rental period.</p>
            <p><strong>5. Damage:</strong> The renter is responsible for any damage to the vehicle during the rental period.</p>
            <p><strong>6. Cancellation:</strong> Cancellations made less than 24 hours before pickup are subject to a 50% charge.</p>
            <p><strong>7. Age Requirement:</strong> Drivers must be at least 21 years old and hold a valid driver's license.</p>
            <p><strong>8. Mileage:</strong> Standard mileage limits apply. Excess mileage will be charged at ₹10/km.</p>
            <p><strong>9. Late Return:</strong> Late returns will be charged at 2x the hourly rate.</p>
            <p><strong>10. Governing Law:</strong> These terms are governed by the laws of India.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="terms"
          checked={bookingData.termsAccepted}
          onCheckedChange={(checked) => setBookingData(prev => ({ ...prev, termsAccepted: !!checked }))}
        />
        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I accept the terms and conditions and agree to the rental agreement
        </label>
      </div>
    </motion.div>
  );

  const renderLicenseUpload = () => (
    <motion.div
      key="license"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Upload Driver's License</h3>
        <p className="text-muted-foreground">
          Please upload a clear photo of your driver's license
        </p>
      </div>

      <LicenseUpload onUploaded={handleLicenseUploaded} />

      {bookingData.licenseId && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">License uploaded successfully</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your license has been submitted for verification
          </p>
        </div>
      )}
    </motion.div>
  );

  const renderPayment = () => (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 sm:space-y-6"
    >
      {bookingError && (
        <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Booking Error</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {bookingError}
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
          <div className="flex justify-between text-sm">
            <span>Base rental ({bookingData.totalDays} days)</span>
            <span>{formatINRFromPaise((car.price_in_paise || car.pricePerDay * 100) * bookingData.totalDays)}</span>
          </div>
          
          {Object.entries(bookingData.extras).map(([key, enabled]) => {
            if (!enabled) {return null;}
            const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
            const names = { driver: 'Driver', gps: 'GPS', childSeat: 'Child Seat', insurance: 'Insurance' };
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
            <span>{formatINRFromPaise(calculateTotal() * 100)}</span>
          </div>
          
          {bookingData.advanceBooking && (
            <div className="flex justify-between text-primary font-medium text-sm sm:text-base">
              <span>Advance Payment (10%)</span>
              <span>{formatINRFromPaise(bookingData.advanceAmount * 100)}</span>
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

  const renderConfirmation = () => (
    <motion.div
      key="confirmation"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4 sm:space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
      </motion.div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-success mb-1 sm:mb-2">
          {bookingData.advanceBooking ? 'Reservation Confirmed!' : 'Booking Confirmed!'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {bookingData.advanceBooking 
            ? 'Your car has been reserved with advance payment.' 
            : `Your ${car.title} has been successfully booked.`}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          <div className="flex justify-between text-sm">
            <span>Car Model</span>
            <span className="font-medium">{car.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Amount</span>
            <span className="font-bold">
              {bookingData.advanceBooking 
                ? formatINRFromPaise(bookingData.advanceAmount * 100) 
                : formatINRFromPaise(calculateTotal() * 100)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dates</span>
            <span>{bookingData.startDate} to {bookingData.endDate}</span>
          </div>
          {bookingData.advanceBooking && (
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <Badge variant="secondary" className="text-xs">Advance Booking</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <Button variant="outline" className="w-full" onClick={onClose} size="sm">
          Close
        </Button>
        <Button className="w-full" onClick={() => {}} size="sm">
          View Booking Details
        </Button>
      </div>
    </motion.div>
  );

  return (
    <>
      {createPortal(
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 modal-overlay flex items-center justify-center p-2 sm:p-4 overflow-hidden booking-flow-modal"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col modal-content relative"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxHeight: '95vh',
              margin: 'auto'
            }}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{stepTitles[currentStep]}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Booking {car.title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">✕</Button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center space-x-1 sm:space-x-2 mt-4 overflow-x-auto pb-2">
                {steps.map((step, index) => {
                  const Icon = stepIcons[step];
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  
                  return (
                    <Fragment key={step}>
                      <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all flex-shrink-0 text-xs sm:text-base ${
                        isCompleted ? 'bg-success text-white' :
                        isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-0.5 w-4 sm:w-8 transition-all flex-shrink-0 ${
                          isCompleted ? 'bg-success' : 'bg-muted'
                        }`} />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div 
              ref={contentRef}
              className="p-4 sm:p-6 overflow-y-auto flex-grow"
              style={{
                maxHeight: 'calc(95vh - 160px)',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <AnimatePresence mode="wait">
                {currentStep === 'dates' && renderDateSelection()}
                {currentStep === 'phone' && renderPhoneCollection()}
                {currentStep === 'extras' && renderExtrasSelection()}
                {currentStep === 'terms' && renderTermsAndConditions()}
                {currentStep === 'license' && renderLicenseUpload()}
                {currentStep === 'payment' && renderPayment()}
                {currentStep === 'confirmation' && renderConfirmation()}
              </AnimatePresence>
            </div>

            {/* Sticky Footer - Always Visible */}
            {currentStep !== 'confirmation' && (
              <div className="sticky bottom-0 w-full bg-white/60 backdrop-blur-md border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                <div>
                  {currentStep !== 'dates' && (
                    <Button variant="outline" onClick={handleBack} disabled={isLoading} size="sm">
                      Back
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-lg">
                      {bookingData.advanceBooking 
                        ? formatINRFromPaise(bookingData.advanceAmount * 100)
                        : formatINRFromPaise(calculateTotal() * 100)}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleNext} 
                    disabled={isLoading || 
                      (currentStep === 'dates' && (!bookingData.startDate || !bookingData.endDate)) ||
                      (currentStep === 'phone' && !bookingData.phoneNumber) ||
                      (currentStep === 'terms' && !bookingData.termsAccepted) ||
                      (currentStep === 'license' && !bookingData.licenseId)
                    }
                    className="min-w-[80px] sm:min-w-[120px] text-sm sm:text-base"
                    size="sm"
                  >
                    {isLoading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      currentStep === 'payment' ? 'Proceed to Pay' : currentStep === 'license' ? 'Continue' : 'Next'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Payment Gateway Modal */}
      <PaymentGateway
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        bookingData={{
          carId: car.id,
          carTitle: car.title,
          carImage: car.image,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          duration: {
            hours: bookingData.totalDays * 24,
            days: bookingData.totalDays,
            billingHours: bookingData.totalDays * 24
          },
          subtotal: calculateTotal(),
          serviceCharge: 0,
          total: calculateTotal()
        }}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};