import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatINRFromPaise } from '@/utils/currency';
import { validateBookingDuration, formatDuration } from '@/utils/booking/dateValidation';

interface DatesStepProps {
  bookingData: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    totalDays: number;
  };
  car: {
    pricePerDay: number;
    price_in_paise?: number;
  };
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export const DatesStep: React.FC<DatesStepProps> = ({
  bookingData,
  car,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange
}) => {
  // Validate booking duration (minimum 12 hours)
  const validation = useMemo(() => {
    return validateBookingDuration(
      bookingData.startDate,
      bookingData.startTime,
      bookingData.endDate,
      bookingData.endTime
    );
  }, [bookingData.startDate, bookingData.startTime, bookingData.endDate, bookingData.endTime]);

  const calculateTotal = () => {
    return (car.price_in_paise ? car.price_in_paise / 100 : car.pricePerDay) * bookingData.totalDays;
  };

  return (
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
            onChange={(e) => onStartDateChange(e.target.value)}
            className="mt-1 text-sm"
            min={new Date().toISOString().split('T')[0]}
            aria-describedby="startDate-help"
            autoFocus
            data-testid="start-date-input"
          />
          <p id="startDate-help" className="text-xs text-muted-foreground mt-1">
            Select your pickup date
          </p>
        </div>
        <div>
          <Label htmlFor="endDate" className="text-sm">Return Date</Label>
          <Input
            id="endDate"
            type="date"
            value={bookingData.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="mt-1 text-sm"
            min={bookingData.startDate || new Date().toISOString().split('T')[0]}
            aria-describedby="endDate-help"
          />
          <p id="endDate-help" className="text-xs text-muted-foreground mt-1">
            Select your return date
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="startTime" className="text-sm">Pickup Time</Label>
          <Select 
            value={bookingData.startTime} 
            onValueChange={onStartTimeChange}
          >
            <SelectTrigger className="mt-1 text-sm" aria-describedby="startTime-help">
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
          <p id="startTime-help" className="text-xs text-muted-foreground mt-1">
            Select your pickup time
          </p>
        </div>
        <div>
          <Label htmlFor="endTime" className="text-sm">Return Time</Label>
          <Select 
            value={bookingData.endTime} 
            onValueChange={onEndTimeChange}
          >
            <SelectTrigger className="mt-1 text-sm" aria-describedby="endTime-help">
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
          <p id="endTime-help" className="text-xs text-muted-foreground mt-1">
            Select your return time
          </p>
        </div>
      </div>

      {/* Validation feedback */}
      {bookingData.startDate && bookingData.endDate && !validation.isValid && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validation.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success summary */}
      {validation.isValid && validation.hours && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-4 bg-primary-light rounded-lg space-y-2"
          role="status"
          aria-live="polite"
        >
          <div className="flex justify-between items-center">
            <p className="text-xs sm:text-sm font-medium text-primary">
              Duration: {formatDuration(validation.hours)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ({bookingData.totalDays} day{bookingData.totalDays > 1 ? 's' : ''} billed)
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-primary">
            Total: {formatINRFromPaise((car.price_in_paise || car.pricePerDay * 100) * bookingData.totalDays)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};