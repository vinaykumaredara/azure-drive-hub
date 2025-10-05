import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Car, User, CheckCircle, XCircle, RotateCcw, DollarSign, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtime';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '@/components/ImageCarousel';

interface Booking {
  id: string;
  user_id: string | null;
  car_id: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_amount: number | null;
  payment_id?: string | null;
  hold_expires_at?: string | null;
  hold_until?: string | null;
  hold_amount?: number | null;
  payment_status?: string | null;
  created_at: string | null;
  cars?: {
    title: string | null;
    make: string | null;
    model: string | null;
    image_urls: string[] | null;
  } | null;
  users?: {
    full_name: string | null;
  } | null;
}

const AdminBookingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  // Real-time subscription for bookings
  useRealtimeSubscription(
    'bookings',
    (payload) => {
      setBookings(prev => [...prev, payload.new as Booking]);
    },
    (payload) => {
      setBookings(prev => prev.map(booking => 
        booking.id === payload.new.id ? payload.new as Booking : booking
      ));
    },
    (payload) => {
      setBookings(prev => prev.filter(booking => booking.id !== payload.old.id));
    }
  );

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (
            title,
            make,
            model,
            image_urls
          ),
          users (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      setBookings(data as Booking[] || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await (supabase
        .from('bookings') as any)
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {throw error;}
      
      toast({
        title: "Success",
        description: `Booking ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      // Call the cancel-booking edge function
      const { error } = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId }
      });

      if (error) {throw error;}
      
      toast({
        title: "Success",
        description: "Booking cancelled and refund initiated",
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-primary text-primary-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success-foreground';
      case 'partial_hold':
        return 'bg-warning text-warning-foreground';
      case 'unpaid':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'refunded':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => 
    selectedStatus === 'all' || booking.status === selectedStatus
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/admin')}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Booking Management</h2>
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.map((booking) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {booking.cars?.image_urls && booking.cars.image_urls.length > 0 ? (
                        <ImageCarousel images={booking.cars.image_urls} className="w-16 h-16 rounded" />
                      ) : (
                        <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                          <Car className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {booking.cars?.title || 'Car Booking'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.cars?.make} {booking.cars?.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <User className="h-3 w-3 inline mr-1" />
                        {booking.users?.full_name || 'Customer'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status}</span>
                      </Badge>
                      {booking.payment_status && (
                        <Badge className={getPaymentStatusColor(booking.payment_status)}>
                          <DollarSign className="h-3 w-3" />
                          <span className="ml-1">
                            {booking.payment_status === 'partial_hold' ? 'Hold' : 
                             booking.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.start_datetime).toLocaleDateString()} - {' '}
                      {new Date(booking.end_datetime).toLocaleDateString()}
                    </p>
                    <p className="font-semibold text-primary">
                      <DollarSign className="h-4 w-4 inline" />
                      {booking.total_amount}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This action will initiate a refund process.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelBooking(booking.id)}>
                                Yes, Cancel & Refund
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this confirmed booking? This will initiate a refund.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelBooking(booking.id)}>
                                Yes, Cancel & Refund
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {(booking.status === 'completed' || booking.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Refund
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hold and License Information */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {booking.hold_until && booking.payment_status === 'partial_hold' && (
                    <div className="p-3 bg-warning/10 rounded-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium text-warning">Hold Active</p>
                        <p className="text-xs text-warning-foreground">
                          Expires: {new Date(booking.hold_until).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {booking.hold_amount && booking.payment_status === 'partial_hold' && (
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Hold Amount</p>
                      <p className="text-lg font-bold text-blue-600">₹{booking.hold_amount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {selectedStatus === 'all' ? 'No bookings yet' : `No ${selectedStatus} bookings`}
          </h3>
          <p className="text-muted-foreground">
            {selectedStatus === 'all' 
              ? 'Bookings will appear here when customers make reservations' 
              : `No bookings with ${selectedStatus} status found`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminBookingManagement;