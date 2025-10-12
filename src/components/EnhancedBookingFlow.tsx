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
import { useAuth } from '@/hooks/use-auth';
import { DatesStep } from '@/components/booking-steps/DatesStep';
import { PhoneStep } from '@/components/booking-steps/PhoneStep';
import { ExtrasStep } from '@/components/booking-steps/ExtrasStep';
import { TermsStep } from '@/components/booking-steps/TermsStep';
import { LicenseStep } from '@/components/booking-steps/LicenseStep';
import { PaymentStep } from '@/components/booking-steps/PaymentStep';
import { ConfirmationStep } from '@/components/booking-steps/ConfirmationStep';

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
  payment: 'Payment Options',
  confirmation: 'Booking Confirmed'
};

interface License {
  id: string;
  user_id: string;
  storage_path: string;
  verified: boolean | null;
  created_at: string;
}

export const EnhancedBookingFlow: React.FC<EnhancedBookingFlowProps> = ({ car, onClose, onBookingSuccess }) => {
  const [currentStep, setCurrentStep] = useState<Step>('dates');
  const [existingLicense, setExistingLicense] = useState<{
    id: string;
    verified: boolean | null;
    createdAt: string;
  } | null>(null);
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
  const { profile, profileLoading } = useAuth();

  // Reordered steps: phone first, then dates, terms, license, payment (no extras)
  const steps: Step[] = ['phone', 'dates', 'terms', 'license', 'payment', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  // Handle body scroll locking for mobile and focus management
  useEffect(() => {
    console.log('[EnhancedBookingFlow] Modal opened');
    document.body.style.overflow = 'hidden';
    
    // Focus the first focusable element in the modal when it opens
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
    
    return () => {
      console.log('[EnhancedBookingFlow] Modal closed');
      document.body.style.overflow = '';
    };
  }, []);

  // Handle booking restoration on component mount
  useEffect(() => {
    const restoreBooking = async () => {
      const pendingBookingRaw = sessionStorage.getItem('pendingBooking');
      if (pendingBookingRaw) {
        try {
          const pendingBooking = JSON.parse(pendingBookingRaw);
          
          // Wait for profile to load
          let attempts = 0;
          while (profileLoading && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // Check if profile has phone number
          if (!profile?.phone) {
            if (currentStep !== 'phone') {
              setCurrentStep('phone');
            }
            return;
          }
          
          // Validate draft: check if pickup/return dates are missing
          if (!pendingBooking.pickup?.date || !pendingBooking.return?.date) {
            if (currentStep !== 'dates') {
              setCurrentStep('dates');
            }
            // Populate the booking data with the draft
            setBookingData(prev => ({
              ...prev,
              startDate: pendingBooking.pickup?.date || '',
              endDate: pendingBooking.return?.date || '',
              startTime: pendingBooking.pickup?.time || '10:00',
              endTime: pendingBooking.return?.time || '18:00'
            }));
            return;
          }
          
          // If dates exist, proceed to terms
          if (currentStep !== 'terms') {
            setCurrentStep('terms');
          }
          
          // Populate the booking data with the draft
          setBookingData(prev => ({
            ...prev,
            startDate: pendingBooking.pickup.date,
            endDate: pendingBooking.return.date,
            startTime: pendingBooking.pickup.time || '10:00',
            endTime: pendingBooking.return.time || '18:00'
          }));
          
          // Clear the pending booking from sessionStorage
          sessionStorage.removeItem('pendingBooking');
        } catch (error) {
          console.error('EnhancedBookingFlow: Failed to parse pending booking:', error);
          sessionStorage.removeItem('pendingBooking');
        }
      }
    };
    
    restoreBooking();
  }, [profile, profileLoading, currentStep]);

  // Fetch user phone number and existing licenses on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch phone number
          const { data: profile, error: phoneError } = await (supabase
            .from('users') as any)
            .select('phone')
            .eq('id', user.id)
            .single();
            
          if (!phoneError && profile && profile.phone) {
            setBookingData(prev => ({
              ...prev,
              phoneNumber: profile.phone
            }));
          }
          
          // Fetch existing licenses
          const { data: licenses, error: licenseError } = await (supabase
            .from('licenses') as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (!licenseError && licenses && licenses.length > 0) {
            // Set the most recent license
            const latestLicense: any = licenses[0];
            setExistingLicense({
              id: latestLicense.id,
              verified: latestLicense.verified,
              createdAt: latestLicense.created_at
            });
          }
        }
      } catch (error) {
        // Error fetching user data - silently fail as this is not critical
      }
    };
    
    fetchUserData();
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

  const handleAdvancePayment = async () => {
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
            // Error updating phone number - silently fail as this is not critical
          }
        }
      }
      
      // For advance booking, we'll create a hold record in the database
      const advanceAmount = calculateAdvanceAmount();
      
      // Here we would integrate with the payment gateway for advance payment
      // For now, we'll just simulate it by setting the advance booking flag
      setBookingData(prev => ({
        ...prev,
        advanceBooking: true,
        advanceAmount
      }));
      
      // Show a success message
      toast({
        title: "Advance Payment Successful",
        description: `₹${advanceAmount} has been paid as advance. Your booking is reserved for 24 hours.`,
      });
      
      // Proceed to confirmation
      setCurrentStep('confirmation');
      onBookingSuccess();
      
      // Focus the confirmation panel when it appears
      setTimeout(() => {
        const confirmationPanel = document.getElementById('step-confirmation-panel');
        if (confirmationPanel) {
          confirmationPanel.focus();
        }
      }, 100);
    } catch (error: unknown) {
      console.error('Advance payment error:', error);
      let errorMessage = 'Failed to process advance payment. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setBookingError(errorMessage);
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            // Error updating phone number - silently fail as this is not critical
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
      // Handle booking error
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
      
      // Validate that dates are not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);
      
      if (startDate < today) {
        toast({
          title: "Validation Error",
          description: "Pickup date cannot be in the past",
          variant: "destructive",
        });
        return;
      }
      
      if (endDate < today) {
        toast({
          title: "Validation Error",
          description: "Return date cannot be in the past",
          variant: "destructive",
        });
        return;
      }
      
      // Validate that end date is after start date
      if (endDate < startDate) {
        toast({
          title: "Validation Error",
          description: "Return date must be after pickup date",
          variant: "destructive",
        });
        return;
      }
      
      // Validate that end date is not the same as start date with end time before start time
      if (endDate.getTime() === startDate.getTime()) {
        const startTime = bookingData.startTime.split(':').map(Number);
        const endTime = bookingData.endTime.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        
        if (endMinutes <= startMinutes) {
          toast({
            title: "Validation Error",
            description: "Return time must be after pickup time",
            variant: "destructive",
          });
          return;
        }
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
      const cleanedPhone = bookingData.phoneNumber.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid 10-digit Indian phone number",
          variant: "destructive",
        });
        return;
      }
      
      // Update with cleaned phone number
      setBookingData(prev => ({
        ...prev,
        phoneNumber: cleanedPhone
      }));
      
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
      // Instead of immediately opening payment gateway, we'll handle the payment options in the payment step
      // Open payment gateway only when user clicks the payment button
      setIsPaymentOpen(true);
    }
    
    // Scroll to top when advancing to next step and focus the new panel
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const newPanel = document.getElementById(`step-${currentStep}-panel`);
      if (newPanel) {
        newPanel.focus();
      }
    }, 100);
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      // Scroll to top when going back and focus the new panel
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const newPanel = document.getElementById(`step-${steps[currentIndex - 1]}-panel`);
        if (newPanel) {
          newPanel.focus();
        }
      }, 100);
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

  const onAttemptConfirm = async () => {
    if (profileLoading) {
      // wait or show spinner
      return;
    }

    const phone = profile?.phone;
    if (!phone) {
      // prompt for phone modal or navigate to profile page
      toast({
        title: "Phone Number Required",
        description: "Please add your phone number to continue with booking.",
        variant: "destructive",
      });
      // In a more complete implementation, we would open a phone modal here
      return;
    }

    // proceed with hold/payment creation
    if (bookingData.advanceBooking) {
      handleAdvancePayment();
    } else {
      setIsPaymentOpen(true);
    }
  };

  const renderDateSelection = () => (
    <DatesStep
      bookingData={bookingData}
      car={car}
      onStartDateChange={(date) => setBookingData(prev => ({ ...prev, startDate: date }))}
      onEndDateChange={(date) => setBookingData(prev => ({ ...prev, endDate: date }))}
      onStartTimeChange={(time) => setBookingData(prev => ({ ...prev, startTime: time }))}
      onEndTimeChange={(time) => setBookingData(prev => ({ ...prev, endTime: time }))}
    />
  );

  const renderPhoneCollection = () => (
    <PhoneStep
      phoneNumber={bookingData.phoneNumber}
      onPhoneNumberChange={(phone) => setBookingData(prev => ({ ...prev, phoneNumber: phone }))}
    />
  );

  const renderExtrasSelection = () => (
    <ExtrasStep
      extras={bookingData.extras}
      advanceBooking={bookingData.advanceBooking}
      advanceAmount={bookingData.advanceAmount}
      totalDays={bookingData.totalDays}
      pricePerDay={car.pricePerDay}
      price_in_paise={car.price_in_paise}
      onExtraToggle={(extra) => setBookingData(prev => ({
        ...prev,
        extras: {
          ...prev.extras,
          [extra]: !prev.extras[extra]
        }
      }))}
      onAdvanceBookingToggle={(isAdvance, amount) => setBookingData(prev => ({
        ...prev,
        advanceBooking: isAdvance,
        advanceAmount: amount
      }))}
    />
  );

  const renderTermsAndConditions = () => (
    <TermsStep
      termsAccepted={bookingData.termsAccepted}
      onTermsAcceptanceChange={(accepted) => setBookingData(prev => ({ ...prev, termsAccepted: accepted }))}
    />
  );

  const renderLicenseUpload = () => (
    <LicenseStep
      existingLicense={existingLicense}
      licenseId={bookingData.licenseId}
      onLicenseUploaded={handleLicenseUploaded}
      onExistingLicenseSelect={(licenseId) => {
        setBookingData(prev => ({
          ...prev,
          licenseId
        }));
        toast({
          title: "License Selected",
          description: "Using your existing license for this booking.",
        });
      }}
    />
  );

  const renderPayment = () => (
    <PaymentStep
      bookingError={bookingError}
      advanceBooking={bookingData.advanceBooking}
      advanceAmount={bookingData.advanceAmount}
      totalAmount={calculateTotal()}
      extras={bookingData.extras}
      onPaymentOptionChange={(isAdvance) => setBookingData(prev => ({ ...prev, advanceBooking: isAdvance }))}
    />
  );

  const renderConfirmation = () => (
    <ConfirmationStep
      carTitle={car.title}
      advanceBooking={bookingData.advanceBooking}
      advanceAmount={bookingData.advanceAmount}
      totalAmount={calculateTotal()}
      startDate={bookingData.startDate}
      endDate={bookingData.endDate}
      onClose={onClose}
    />
  );

  return createPortal(
    <div className="booking-flow-portal">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 modal-overlay flex items-center justify-center p-0 sm:p-4 overflow-hidden booking-flow-modal z-[9999] sm:backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-flow-title"
        onKeyDown={(e) => {
          // Close modal on Escape key
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full h-full sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[95vh] flex flex-col modal-content relative sm:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxHeight: '100vh',
            margin: 'auto'
          }}
          role="document"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="booking-flow-title" className="text-lg sm:text-xl font-bold">{stepTitles[currentStep]}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Booking {car.title}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="h-8 w-8 p-0"
                aria-label="Close booking flow"
              >
                ✕
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center space-x-1 sm:space-x-2 mt-4 overflow-x-auto pb-2" role="tablist" aria-label="Booking steps">
              {steps.map((step, index) => {
                const Icon = stepIcons[step];
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <Fragment key={step}>
                    <div 
                      className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all flex-shrink-0 text-xs sm:text-base ${
                        isCompleted ? 'bg-success text-white' :
                        isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`step-${step}-panel`}
                      id={`step-${step}-tab`}
                    >
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
              maxHeight: 'calc(100vh - 160px)',
              WebkitOverflowScrolling: 'touch',
            }}
            id={`step-${currentStep}-panel`}
            role="tabpanel"
            aria-labelledby={`step-${currentStep}-tab`}
            tabIndex={-1}
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
            <div className="sticky bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
              <div>
                {currentStep !== 'dates' && (
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={isLoading} 
                    size="sm"
                    aria-label="Go back to previous step"
                  >
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
                  onClick={() => {
                    if (currentStep === 'payment') {
                      // Handle payment based on selected option
                      if (bookingData.advanceBooking) {
                        // For advance booking, we need to handle the 10% payment
                        handleAdvancePayment();
                      } else {
                        // For full payment, open the payment gateway
                        setIsPaymentOpen(true);
                      }
                    } else {
                      // For other steps, proceed to next step
                      handleNext();
                    }
                  }}
                  disabled={isLoading || 
                    (currentStep === 'dates' && (!bookingData.startDate || !bookingData.endDate)) ||
                    (currentStep === 'phone' && !bookingData.phoneNumber) ||
                    (currentStep === 'terms' && !bookingData.termsAccepted) ||
                    (currentStep === 'license' && !bookingData.licenseId)
                  }
                  className="min-w-[80px] sm:min-w-[120px] text-sm sm:text-base"
                  size="sm"
                  aria-label={currentStep === 'payment' ? 'Proceed to payment' : currentStep === 'license' ? 'Continue to next step' : 'Continue to next step'}
                >
                  {isLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                      aria-label="Processing"
                    />
                  ) : (
                    currentStep === 'payment' ? 'Proceed to Pay' : currentStep === 'license' ? 'Continue' : 'Next'
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

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
          total: bookingData.advanceBooking ? bookingData.advanceAmount : calculateTotal()
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>,
    document.body
  );
};