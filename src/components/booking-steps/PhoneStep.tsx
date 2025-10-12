import React from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { phoneSchema } from '@/utils/validation';

interface PhoneStepProps {
  phoneNumber: string | null;
  onPhoneNumberChange: (phone: string) => void;
}

export const PhoneStep: React.FC<PhoneStepProps> = ({
  phoneNumber,
  onPhoneNumberChange
}) => {
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handlePhoneChange = (value: string) => {
    onPhoneNumberChange(value);
    
    // Validate on blur or after typing stops
    if (value.length >= 10) {
      const validation = phoneSchema.safeParse('+91' + value);
      if (!validation.success) {
        setValidationError(validation.error.errors[0]?.message || 'Invalid phone number');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  };

  return (
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
              value={phoneNumber || ''}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`pl-10 sm:pl-12 text-sm ${validationError ? 'border-destructive' : ''}`}
              maxLength={10}
              aria-describedby="phone-help"
              pattern="[6-9][0-9]{9}"
              inputMode="tel"
            />
          </div>
          {validationError && (
            <p className="text-xs text-destructive mt-1">{validationError}</p>
          )}
          <p id="phone-help" className="text-xs text-muted-foreground mt-1">
            We'll use this for booking updates and verification
          </p>
        </div>
      </div>
    </motion.div>
  );
};