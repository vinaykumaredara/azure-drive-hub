import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Eye,
  User,
  Car,
  CreditCard,
  Phone,
  Bell,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatINRFromPaise } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

interface Booking {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  car_id: string;
  car_title: string;
  car_make: string | null;
  car_model: string | null;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'partial_hold' | 'paid' | 'cancelled';
  hold_amount: number | null; // in paise
  total_amount: number; // in paise
  hold_until: string | null;
  created_at: string;
  notes: string | null;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [_sortBy, _setSortBy] = useState<keyof Booking>('created_at');
  const [_sortOrder, _setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch bookings from database
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (id, title, make, model, image_urls),
          users (id, full_name, phone)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch auth users for emails
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      // Create email map
      const emailMap = new Map(
        authUsers?.map(authUser => [authUser.id, authUser.email]) || []
      );
      
      // Map to Booking interface
      const mappedBookings: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        user_id: booking.user_id,
        user_name: booking.users?.full_name || 'Unknown',
        user_email: emailMap.get(booking.user_id) || 'No email',
        user_phone: booking.users?.phone || 'No phone',
        car_id: booking.car_id,
        car_title: booking.cars?.title || 'Unknown Car',
        car_make: booking.cars?.make || null,
        car_model: booking.cars?.model || null,
        start_datetime: booking.start_datetime,
        end_datetime: booking.end_datetime,
        status: booking.status,
        payment_status: booking.payment_status,
        hold_amount: booking.hold_amount_paise,
        total_amount: booking.total_amount_paise || 0,
        hold_until: booking.hold_expires_at,
        created_at: booking.created_at,
        notes: booking.notes || null
      }));
      
      setBookings(mappedBookings);
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

  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Real-time subscription
  useRealtimeTable('bookings', fetchBookings);

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[_sortBy];
      const bValue = b[_sortBy];
      
      // Handle null values
      if (aValue === null && bValue === null) {return 0;}
      if (aValue === null) {return 1;}
      if (bValue === null) {return -1;}
      
      // Type guard for comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return _sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return _sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      }
      
      // Convert to string for other types
      const aStr = String(aValue);
      const bStr = String(bValue);
      return _sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    
    return filtered;
  }, [bookings, searchTerm, statusFilter, paymentFilter, _sortBy, _sortOrder]);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  // Get payment status badge variant
  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial_hold': return 'secondary';
      case 'unpaid': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  // Get payment status text
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partial_hold': return 'Partial Hold';
      case 'unpaid': return 'Unpaid';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Handle booking action
  const handleBookingAction = async (bookingId: string, action: 'approve' | 'cancel' | 'complete') => {
    try {
      let newStatus: string;
      if (action === 'approve') newStatus = 'confirmed';
      else if (action === 'cancel') newStatus = 'cancelled';
      else newStatus = 'completed';
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Log audit action
      await supabase.from('audit_logs').insert({
        action: `booking_${action}`,
        description: `Booking ${bookingId} ${action}d`,
        metadata: { booking_id: bookingId, new_status: newStatus }
      });
      
      toast({
        title: `Booking ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
        description: `Booking has been ${action}d successfully`,
      });
      
      setSelectedBooking(null);
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} booking`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Manage all car rental bookings and reservations</p>
        </div>
        <Button>
          <Bell className="w-4 h-4 mr-2" />
          Send Notifications
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatINRFromPaise(
                    bookings
                      .filter(b => b.status === 'completed' || b.status === 'confirmed')
                      .reduce((sum, b) => sum + b.total_amount, 0)
                  )}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial_hold">Partial Hold</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Car className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">Booking #{booking.id.slice(0, 8)}</h3>
                          <Badge variant={getStatusVariant(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                          <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                            {getPaymentStatusText(booking.payment_status)}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.user_name}</span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            📧 {booking.user_email}
                          </p>
                          <p className="text-muted-foreground text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.user_phone}
                          </p>
                          <p className="text-muted-foreground text-sm flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {booking.car_title} {booking.car_make && `(${booking.car_make} ${booking.car_model})`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatINRFromPaise(booking.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date & Time</p>
                        <p className="font-medium text-sm">
                          {new Date(booking.start_datetime).toLocaleDateString()} 
                          <span className="text-muted-foreground ml-1">
                            {new Date(booking.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date & Time</p>
                        <p className="font-medium text-sm">
                          {new Date(booking.end_datetime).toLocaleDateString()}
                          <span className="text-muted-foreground ml-1">
                            {new Date(booking.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium text-sm">
                          {Math.ceil(
                            (new Date(booking.end_datetime).getTime() - 
                             new Date(booking.start_datetime).getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )} days
                        </p>
                      </div>
                      {booking.hold_until && (
                        <div>
                          <p className="text-xs text-muted-foreground">Hold Expires</p>
                          <p className="font-medium text-sm text-warning">
                            {new Date(booking.hold_until).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {booking.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{booking.user_phone}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleBookingAction(booking.id, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button 
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, 'complete')}
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-muted-foreground">View and manage booking information</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{selectedBooking.user_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedBooking.user_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedBooking.user_phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Booking ID</p>
                          <p className="font-medium">{selectedBooking.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Booking Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Booking timeline visualization</p>
                        <p className="text-sm text-muted-foreground mt-1">Interactive timeline coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {selectedBooking.status === 'pending' && (
              <div className="p-6 border-t">
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="destructive"
                    onClick={() => handleBookingAction(selectedBooking.id, 'cancel')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                  <Button 
                    onClick={() => handleBookingAction(selectedBooking.id, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Booking
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Fixed export issue
export default BookingManagement;