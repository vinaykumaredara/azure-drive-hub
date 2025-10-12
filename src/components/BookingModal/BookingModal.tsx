import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, FileText, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { toast } from '@/hooks/use-toast';

interface Car {
  id: string;
  title: string;
  model: string;
  make?: string;
  year?: number;
  image: string;
  images?: string[];
  pricePerDay: number;
  location: string;
  fuel: string;
  transmission: string;
  seats: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  badges?: string[];
  thumbnail?: string;
  bookingStatus?: string;
  price_in_paise?: number;
  image_urls?: string[] | null;
  image_paths?: string[] | null;
  status?: string;
  isArchived?: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, car }) => {
  const { 
    bookingData, 
    closeBookingModal, 
    handleDateTimeSubmit, 
    handleTermsAccept, 
    handleLicenseUpload,
    handlePaymentSubmit
  } = useBookingFlow();
  
  const [currentStep, setCurrentStep] = useState<'dates' | 'terms' | 'license' | 'payment' | 'confirmation'>('dates');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<'full' | 'hold' | null>(null);

  // Calculate total cost
  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    
    const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`);
    const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`);
    const hours = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    
    // Use daily rate if booking is for full days, otherwise hourly
    if (hours >= 24 && hours % 24 === 0) {
      return days * car.pricePerDay;
    } else {
      const hourlyRate = car.pricePerDay / 24;
      return hours * hourlyRate;
    }
  };

  const totalAmount = calculateTotal();
  const holdAmount = Math.round(totalAmount * 0.1);

  // Handle date & time submission
  const handleDateTimeContinue = () => {
    if (startDate && endDate && handleDateTimeSubmit(startDate, endDate, startTime, endTime)) {
      setCurrentStep('terms');
    }
  };

  // Handle terms acceptance
  const handleTermsContinue = () => {
    if (handleTermsAccept(termsAccepted)) {
      setCurrentStep('license');
    }
  };

  // Handle license upload
  const handleLicenseContinue = async () => {
    if (!licenseFile) {
      toast({
        title: "License Required",
        description: "Please upload your driver's license",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await handleLicenseUpload(licenseFile);
      if (result) {
        setCurrentStep('payment');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle payment submission
  const handlePaymentContinue = async () => {
    if (paymentChoice && await handlePaymentSubmit(paymentChoice)) {
      setCurrentStep('confirmation');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLicenseFile(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setLicenseFile(file);
      }
    };
    input.click();
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('dates');
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime('10:00');
      setEndTime('18:00');
      setTermsAccepted(false);
      setLicenseFile(null);
      setPaymentChoice(null);
    }
  }, [isOpen]);

  const handleBack = () => {
    switch (currentStep) {
      case 'terms':
        setCurrentStep('dates');
        break;
      case 'license':
        setCurrentStep('terms');
        break;
      case 'payment':
        setCurrentStep('license');
        break;
      default:
        break;
    }
  };

  const handleClose = () => {
    closeBookingModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            Book {car.title || car.model}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="px-6 py-2 flex items-center justify-center gap-2">
          {['dates', 'terms', 'license', 'payment', 'confirmation'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                currentStep === step ? 'bg-primary text-primary-foreground' : 
                ['dates', 'terms', 'license', 'payment'].indexOf(currentStep) > index ? 'bg-success text-success-foreground' : 'bg-muted'
              }`}>
                {['dates', 'terms', 'license', 'payment'].indexOf(currentStep) > index ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 4 && (
                <div className={`h-0.5 w-8 ${
                  ['dates', 'terms', 'license', 'payment'].indexOf(currentStep) > index ? 'bg-success' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentStep === 'dates' && (
              <motion.div
                key="dates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Select Dates & Time
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
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
                      <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
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
                      <label htmlFor="start-time" className="text-sm font-medium">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          id="start-time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="end-time" className="text-sm font-medium">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          id="end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {startDate && endDate && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Total Duration</p>
                          <p className="text-sm text-muted-foreground">
                            {format(startDate, "MMM d")} to {format(endDate, "MMM d")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 'terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Terms & Conditions
                  </h3>
                  
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
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
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the terms and conditions and agree to the rental agreement
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'license' && (
              <motion.div
                key="license"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Upload Driver's License
                  </h3>
                  
                  <p className="text-muted-foreground">
                    Please upload a clear photo of your driver's license for verification
                  </p>
                  
                  <div className="space-y-4">
                    {licenseFile ? (
                      <div className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center bg-primary/5">
                        <FileText className="w-12 h-12 mx-auto text-primary mb-4" />
                        <h3 className="text-lg font-medium mb-2">License Ready for Upload</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {licenseFile.name}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setLicenseFile(null)}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload Your License</h3>
                        <p className="text-muted-foreground mb-4">
                          Take a clear photo of your driver's license or upload a file
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={handleCameraCapture}
                          >
                            Take Photo
                          </Button>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="outline">
                              Choose File
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supports: JPG, PNG (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Options
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={paymentChoice === 'hold' ? "default" : "outline"}
                      className="h-auto p-6 flex flex-col items-center justify-center gap-2"
                      onClick={() => setPaymentChoice('hold')}
                    >
                      <div className="text-2xl font-bold">10% Hold</div>
                      <div className="text-sm text-muted-foreground">
                        Pay ₹{holdAmount.toLocaleString('en-IN')} now to hold
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pay remaining ₹{(totalAmount - holdAmount).toLocaleString('en-IN')} later
                      </div>
                    </Button>
                    
                    <Button
                      variant={paymentChoice === 'full' ? "default" : "outline"}
                      className="h-auto p-6 flex flex-col items-center justify-center gap-2"
                      onClick={() => setPaymentChoice('full')}
                    >
                      <div className="text-2xl font-bold">Full Payment</div>
                      <div className="text-sm">
                        Pay ₹{totalAmount.toLocaleString('en-IN')} now
                      </div>
                      <div className="text-xs text-primary-foreground/80">
                        Get 5% discount on full payment
                      </div>
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Car:</span>
                        <span className="font-medium">{car.title || car.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dates:</span>
                        <span className="font-medium">
                          {startDate && endDate ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-success mb-2">
                    {paymentChoice === 'hold' ? 'Reservation Confirmed!' : 'Booking Confirmed!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {paymentChoice === 'hold' 
                      ? 'Your car has been reserved with advance payment.' 
                      : `Your ${car.title || car.model} has been successfully booked.`}
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Car Model</span>
                    <span className="font-medium">{car.title || car.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Amount</span>
                    <span className="font-bold">
                      {paymentChoice === 'hold' 
                        ? `₹${holdAmount.toLocaleString('en-IN')}` 
                        : `₹${totalAmount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dates</span>
                    <span>
                      {startDate && endDate ? `${format(startDate, "MMM d")} to ${format(endDate, "MMM d")}` : ''}
                    </span>
                  </div>
                  {paymentChoice === 'hold' && (
                    <div className="flex justify-between text-sm">
                      <span>Status</span>
                      <span className="text-primary font-medium">Advance Booking</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    Close
                  </Button>
                  <Button className="w-full">
                    View Booking Details
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer with navigation buttons */}
        {currentStep !== 'confirmation' && (
          <div className="border-t p-4 bg-background">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'dates'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">
                    ₹{paymentChoice === 'hold' ? holdAmount.toLocaleString('en-IN') : totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                
                <Button
                  onClick={() => {
                    switch (currentStep) {
                      case 'dates':
                        handleDateTimeContinue();
                        break;
                      case 'terms':
                        handleTermsContinue();
                        break;
                      case 'license':
                        handleLicenseContinue();
                        break;
                      case 'payment':
                        handlePaymentContinue();
                        break;
                    }
                  }}
                  disabled={
                    (currentStep === 'dates' && (!startDate || !endDate)) ||
                    (currentStep === 'terms' && !termsAccepted) ||
                    (currentStep === 'license' && !licenseFile) ||
                    (currentStep === 'payment' && !paymentChoice) ||
                    isUploading
                  }
                >
                  {isUploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : currentStep === 'payment' ? (
                    'Proceed to Pay'
                  ) : currentStep === 'license' ? (
                    'Upload & Continue'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;