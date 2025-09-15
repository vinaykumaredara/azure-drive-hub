import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, CreditCard, CheckCircle, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface BookingFlowProps {
  car: {
    id: string;
    model: string;
    image: string;
    pricePerDay: number;
    seats: number;
    fuel: string;
    transmission: string;
  };
  onClose: () => void;
}

type Step = 'dates' | 'extras' | 'payment' | 'confirmation';

const stepIcons = {
  dates: Calendar,
  extras: Car,
  payment: CreditCard,
  confirmation: CheckCircle
};

const stepTitles = {
  dates: 'Select Dates & Times',
  extras: 'Add Extras',
  payment: 'Payment Details', 
  confirmation: 'Booking Confirmed'
};

export const BookingFlow: React.FC<BookingFlowProps> = ({ car, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('dates');
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '10:00',
    endTime: '18:00',
    extras: {
      driver: false,
      gps: false,
      childSeat: false,
      insurance: true
    },
    totalDays: 1,
    holdId: null as string | null,
    holdExpiry: null as string | null
  });

  const [isLoading, setIsLoading] = useState(false);

  const steps: Step[] = ['dates', 'extras', 'payment', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  const calculateTotal = () => {
    const basePrice = car.pricePerDay * bookingData.totalDays;
    const extrasPrice = Object.entries(bookingData.extras).reduce((acc, [key, enabled]) => {
      if (!enabled) {return acc;}
      const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
      return acc + (prices[key as keyof typeof prices] || 0);
    }, 0);
    return basePrice + extrasPrice;
  };

  const handleNext = async () => {
    if (currentStep === 'dates') {
      // Create booking hold
      setIsLoading(true);
      try {
        // Simulate API call to create hold
        await new Promise(resolve => setTimeout(resolve, 1500));
        setBookingData(prev => ({
          ...prev,
          holdId: `hold_${Date.now()}`,
          holdExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }));
        setCurrentStep('extras');
      } catch (error) {
        console.error('Failed to create booking hold');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 'extras') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setIsLoading(true);
      try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentStep('confirmation');
      } catch (error) {
        console.error('Payment failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderDateSelection = () => (
    <motion.div
      key="dates"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Pickup Date</Label>
          <Input
            id="startDate"
            type="date"
            value={bookingData.startDate}
            onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="endDate">Return Date</Label>
          <Input
            id="endDate"
            type="date"
            value={bookingData.endDate}
            onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Pickup Time</Label>
          <Select value={bookingData.startTime} onValueChange={(value) => 
            setBookingData(prev => ({ ...prev, startTime: value }))
          }>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={hour} value={`${hour}:00`}>
                    {hour}:00
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="endTime">Return Time</Label>
          <Select value={bookingData.endTime} onValueChange={(value) => 
            setBookingData(prev => ({ ...prev, endTime: value }))
          }>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={hour} value={`${hour}:00`}>
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
          className="p-4 bg-primary-light rounded-lg"
        >
          <p className="text-sm font-medium text-primary">
            Total Duration: {bookingData.totalDays} day{bookingData.totalDays > 1 ? 's' : ''}
          </p>
          <p className="text-lg font-bold text-primary mt-1">
            ₹{car.pricePerDay * bookingData.totalDays}
          </p>
        </motion.div>
      )}
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
      {bookingData.holdId && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-success/10 border border-success/20 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">Car reserved for 10 minutes</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Hold ID: {bookingData.holdId}
          </p>
        </motion.div>
      )}

      <div className="space-y-3">
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
    </motion.div>
  );

  const renderPayment = () => (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              placeholder="MM/YY"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="name">Cardholder Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            className="mt-1"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Base rental ({bookingData.totalDays} days)</span>
            <span>₹{car.pricePerDay * bookingData.totalDays}</span>
          </div>
          
          {Object.entries(bookingData.extras).map(([key, enabled]) => {
            if (!enabled) {return null;}
            const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
            const names = { driver: 'Driver', gps: 'GPS', childSeat: 'Child Seat', insurance: 'Insurance' };
            return (
              <div key={key} className="flex justify-between text-sm">
                <span>{names[key as keyof typeof names]}</span>
                <span>₹{prices[key as keyof typeof prices]}</span>
              </div>
            );
          })}
          
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{calculateTotal()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderConfirmation = () => (
    <motion.div
      key="confirmation"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <div>
        <h3 className="text-2xl font-bold text-success mb-2">Booking Confirmed!</h3>
        <p className="text-muted-foreground">
          Your {car.model} has been successfully booked.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between">
            <span>Booking ID</span>
            <span className="font-mono">BK{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Car Model</span>
            <span>{car.model}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount</span>
            <span className="font-bold">₹{calculateTotal()}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1">
          View Booking Details
        </Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{stepTitles[currentStep]}</h2>
              <p className="text-sm text-muted-foreground">Booking {car.model}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mt-4">
            {steps.map((step, index) => {
              const Icon = stepIcons[step];
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                    isCompleted ? 'bg-success text-white' :
                    isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-8 transition-all ${
                      isCompleted ? 'bg-success' : 'bg-muted'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {currentStep === 'dates' && renderDateSelection()}
            {currentStep === 'extras' && renderExtrasSelection()}
            {currentStep === 'payment' && renderPayment()}
            {currentStep === 'confirmation' && renderConfirmation()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {currentStep !== 'confirmation' && (
          <div className="p-6 border-t bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                {currentStep !== 'dates' && (
                  <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                    Back
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">₹{calculateTotal()}</p>
                </div>
                
                <Button 
                  onClick={handleNext} 
                  disabled={isLoading || (!bookingData.startDate || !bookingData.endDate)}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    currentStep === 'payment' ? 'Pay Now' : 'Continue'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};