import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExtrasStepProps {
  extras: {
    driver: boolean;
    gps: boolean;
    childSeat: boolean;
    insurance: boolean;
  };
  _advanceBooking: boolean;
  _advanceAmount: number;
  totalDays: number;
  pricePerDay: number;
  price_in_paise?: number;
  onExtraToggle: (extra: keyof typeof defaultExtras) => void;
  onAdvanceBookingToggle: (isAdvance: boolean, amount: number) => void;
}

const defaultExtras = {
  driver: { name: 'Professional Driver', price: 500, desc: 'Experienced driver for your trip', recommended: false },
  gps: { name: 'GPS Navigation', price: 200, desc: 'Built-in GPS with latest maps', recommended: false },
  childSeat: { name: 'Child Safety Seat', price: 150, desc: 'Safety seat for children', recommended: false },
  insurance: { name: 'Premium Insurance', price: 300, desc: 'Comprehensive coverage', recommended: true }
};

export const ExtrasStep: React.FC<ExtrasStepProps> = ({
  extras,
  advanceBooking: _advanceBooking,
  advanceAmount: _advanceAmount,
  totalDays,
  pricePerDay,
  price_in_paise,
  onExtraToggle,
  onAdvanceBookingToggle
}) => {
  const calculateTotal = () => {
    const basePrice = (price_in_paise ? price_in_paise / 100 : pricePerDay) * totalDays;
    const extrasPrice = Object.entries(extras).reduce((acc, [key, enabled]) => {
      if (!enabled) {return acc;}
      const prices = { driver: 500, gps: 200, childSeat: 150, insurance: 300 };
      return acc + (prices[key as keyof typeof prices] || 0);
    }, 0);
    return basePrice + extrasPrice;
  };

  const calculateAdvanceAmount = () => {
    return Math.round(calculateTotal() * 0.1); // 10% advance
  };

  return (
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

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2" role="group" aria-label="Extra options">
        {Object.entries(defaultExtras).map(([key, extra]) => (
          <Card 
            key={key} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              extras[key as keyof typeof extras] 
                ? 'ring-2 ring-primary bg-primary-light/20' 
                : ''
            }`}
            role="checkbox"
            aria-checked={extras[key as keyof typeof extras]}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExtraToggle(key as keyof typeof defaultExtras);
              }
            }}
          >
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
                    variant={extras[key as keyof typeof extras] ? "default" : "outline"}
                    size="sm"
                    className="mt-2"
                    onClick={() => onExtraToggle(key as keyof typeof defaultExtras)}
                    aria-label={extras[key as keyof typeof extras] ? `Remove ${extra.name}` : `Add ${extra.name}`}
                  >
                    {extras[key as keyof typeof extras] ? 'Added' : 'Add'}
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
                  onAdvanceBookingToggle(true, advanceAmount);
                  toast({
                    title: "Advance Booking",
                    description: `Pay ₹${advanceAmount} now to reserve this car`,
                  });
                }}
                aria-label="Reserve with 10% advance payment"
              >
                Reserve with 10% Advance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};