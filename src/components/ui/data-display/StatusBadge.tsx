// src/components/ui/data-display/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const getVariant = () => {
    if (variant) return variant;
    
    switch (status.toLowerCase()) {
      case 'published':
      case 'active':
      case 'available':
        return 'default';
      case 'draft':
      case 'pending':
        return 'secondary';
      case 'maintenance':
      case 'unavailable':
        return 'outline';
      case 'deleted':
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default StatusBadge;