import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface TermsStepProps {
  termsAccepted: boolean;
  onTermsAcceptanceChange: (accepted: boolean) => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
  termsAccepted,
  onTermsAcceptanceChange
}) => {
  return (
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
          <div className="space-y-3 text-sm" tabIndex={0} role="document" aria-label="Rental terms and conditions">
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
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsAcceptanceChange(!!checked)}
          aria-describedby="terms-help"
        />
        <label 
          htmlFor="terms" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I accept the terms and conditions and agree to the rental agreement
        </label>
      </div>
      <p id="terms-help" className="text-xs text-muted-foreground px-4">
        You must accept the terms and conditions to proceed with your booking
      </p>
    </motion.div>
  );
};