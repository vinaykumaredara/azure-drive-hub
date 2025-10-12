import React, { useMemo } from 'react';
import { List as FixedSizeList } from 'react-window';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types/dashboard.types';
import { formatINRFromPaise } from '@/utils/currency';
import LazyImage from '@/components/LazyImage';

interface UserDashboardBookingsProps {
  bookings: Booking[];
  searchTerm: string;
  statusFilter: string;
  onCancelBooking?: (bookingId: string) => void;
}

export const UserDashboardBookings: React.FC<UserDashboardBookingsProps> = ({
  bookings,
  searchTerm,
  statusFilter,
  onCancelBooking
}) => {
  // Memoize filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = searchTerm === '' || 
        booking.cars?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const BookingRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const booking = filteredBookings[index];
    const imageUrl = booking.cars?.image_urls?.[0] || booking.cars?.image_paths?.[0];

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="m-2">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {imageUrl && (
                <div className="w-32 h-24 flex-shrink-0">
                  <LazyImage
                    src={imageUrl}
                    alt={booking.cars?.title || 'Car'}
                    className="w-full h-full rounded-lg"
                    aspectRatio="4/3"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.cars?.title || 'Unknown Car'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {booking.cars?.make} {booking.cars?.model}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.start_datetime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.end_datetime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{formatINRFromPaise(booking.total_amount_in_paise || (booking.total_amount || 0) * 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Booking #{booking.id.slice(0, 8)}</span>
                  </div>
                </div>

                {booking.status === 'pending' && onCancelBooking && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onCancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (filteredBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Start by booking your first car'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render normally - virtualization removed for type safety
  return (
    <div className="space-y-4">
      {filteredBookings.map((booking, index) => (
        <BookingRow key={booking.id} index={index} style={{}} />
      ))}
    </div>
  );

  // Render normally for small lists
  return (
    <div className="space-y-4">
      {filteredBookings.map((booking, index) => (
        <BookingRow key={booking.id} index={index} style={{}} />
      ))}
    </div>
  );
};
