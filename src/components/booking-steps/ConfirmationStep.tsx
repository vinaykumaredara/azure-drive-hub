import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConfirmationStepProps {
  carTitle: string;
  advanceBooking: boolean;
  advanceAmount: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  carTitle,
  advanceBooking,
  advanceAmount,
  totalAmount,
  startDate,
  endDate,
  onClose
}) => {
  return (
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
          {advanceBooking ? 'Reservation Confirmed!' : 'Booking Confirmed!'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {advanceBooking 
            ? 'Your car has been reserved with advance payment.' 
            : `Your ${carTitle} has been successfully booked.`}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          <div className="flex justify-between text-sm">
            <span>Car Model</span>
            <span className="font-medium">{carTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Amount</span>
            <span className="font-bold">
              {advanceBooking 
                ? `₹${advanceAmount.toLocaleString('en-IN')}` 
                : `₹${totalAmount.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dates</span>
            <span>{startDate} to {endDate}</span>
          </div>
          {advanceBooking && (
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <Badge variant="secondary" className="text-xs">Advance Booking</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onClose} 
          size="sm"
          aria-label="Close booking confirmation"
        >
          Close
        </Button>
        <Button 
          className="w-full" 
          onClick={() => {}} 
          size="sm"
          aria-label="View booking details"
        >
          View Booking Details
        </Button>
      </div>
    </motion.div>
  );
};