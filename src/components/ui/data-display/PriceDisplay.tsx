// src/components/ui/data-display/PriceDisplay.tsx
import { formatINRFromPaise, toPaise } from '@/utils/currency';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  inPaise?: boolean;
  className?: string;
  showCurrency?: boolean;
}

const PriceDisplay = ({ 
  amount, 
  currency = 'INR', 
  inPaise = false, 
  className = '',
  showCurrency = true
}: PriceDisplayProps) => {
  const amountInPaise = inPaise ? amount : toPaise(amount);
  const formattedAmount = formatINRFromPaise(amountInPaise);
  
  return (
    <span className={className}>
      {showCurrency ? formattedAmount : formattedAmount.replace('₹', '')}
    </span>
  );
};

export default PriceDisplay;