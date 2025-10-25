// src/components/admin/BackButton.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  to?: string;
  className?: string;
}

export const BackButton = ({ to = '/admin', className = '' }: BackButtonProps) => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={() => navigate(to)}
      className={`shrink-0 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
};

export default BackButton;
