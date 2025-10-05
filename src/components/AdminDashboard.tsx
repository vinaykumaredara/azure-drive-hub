import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, Calendar, DollarSign, Settings, Plus, 
  Edit, Trash2, Eye, BarChart3, Bell, Upload,
  CheckCircle, XCircle, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Import all the new section components
// Fixed import issue
import BookingManagement from '@/components/BookingManagement';
import FinancialManagement from '@/components/FinancialManagement';
import FleetOptimization from '@/components/FleetOptimization';
import LicenseVerification from '@/components/LicenseVerification';
import PromoCodeManagement from '@/components/PromoCodeManagement';
import CommunicationCenter from '@/components/CommunicationCenter';
import { MaintenanceScheduler } from '@/components/MaintenanceScheduler';
import CustomerManagement from '@/components/CustomerManagement';
import SystemSettings from '@/components/SystemSettings';
import SecurityCompliance from '@/components/SecurityCompliance';
import StaffManagement from '@/components/StaffManagement';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

interface DashboardStats {
  totalCars: number;
  activeBookings: number;
  monthlyRevenue: number;
  totalUsers: number;
  carsAvailable: number;
  carsInUse: number;
  pendingBookings: number;
  completedBookings: number;
}

// Define proper interfaces for the data structures
interface CarData {
  id: string;
  title: string;
  model: string;
  make: string;
  location_city: string;
  price_per_day: number;
  status: string;
}

interface BookingData {
  id: string;
  status: string;
  total_amount: number;
  start_datetime: string;
  end_datetime: string;
  hold_expires_at: string;
  cars?: {
    title: string;
  };
  users?: {
    full_name: string;
  };
}

const initialStats: DashboardStats = {
  totalCars: 0,
  activeBookings: 0,
  monthlyRevenue: 0,
  totalUsers: 0,
  carsAvailable: 0,
  carsInUse: 0,
  pendingBookings: 0,
  completedBookings: 0
};

// Real-time car data will be fetched from database

// Real-time booking data will be fetched from database

interface AdminDashboardProps {
  onClose?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [newCar, setNewCar] = useState({
    model: '',
    seats: 5,
    fuel: 'petrol',
    transmission: 'manual',
    pricePerDay: 1000,
    location: '',
    images: [] as string[]
  });
  
  // Real-time dashboard data
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [cars, setCars] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Fetch real-time dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch cars with all needed fields
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('id, title, model, make, location_city, price_per_day, status');
        
        if (carsError) {throw carsError;}
        
        // Fetch bookings with user and car info
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id, 
            status, 
            total_amount,
            start_datetime,
            end_datetime,
            hold_expires_at,
            cars(title),
            users(full_name)
          `);
        
        if (bookingsError) {throw bookingsError;}
        
        // Fetch users count
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) {throw usersError;}
        
        // Calculate stats
        const totalCars = carsData?.length || 0;
        const carsAvailable = carsData?.filter((car: CarData) => car.status === 'active').length || 0;
        const carsInUse = carsData?.filter((car: CarData) => car.status === 'booked').length || 0;
        
        const activeBookings = bookingsData?.filter((booking: BookingData) => 
          ['pending', 'confirmed'].includes(booking.status)
        ).length || 0;
        
        const pendingBookings = bookingsData?.filter((booking: BookingData) => 
          booking.status === 'pending'
        ).length || 0;
        
        const completedBookings = bookingsData?.filter((booking: BookingData) => 
          booking.status === 'completed'
        ).length || 0;
        
        const monthlyRevenue = bookingsData?.reduce((sum: number, booking: BookingData) => 
          booking.status === 'completed' ? sum + (booking.total_amount || 0) : sum, 0
        ) || 0;
        
        setStats({
          totalCars,
          activeBookings,
          monthlyRevenue,
          totalUsers: usersCount || 0,
          carsAvailable,
          carsInUse,
          pendingBookings,
          completedBookings
        });
        
        // Set cars and bookings for display
        setCars(carsData || []);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, change, color = 'primary' }: any) => (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <p className={`text-xs ${change > 0 ? 'text-success' : 'text-destructive'}`}>
                  {change > 0 ? '+' : ''}{change}% from last month
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg bg-${color}/10`}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Car}
          title="Total Cars"
          value={stats.totalCars}
          change={0}
        />
        <StatCard
          icon={Calendar}
          title="Active Bookings"
          value={stats.activeBookings}
          change={0}
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          change={0}
        />
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          change={0}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="justify-start" onClick={() => setShowAddCarModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Car
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Manage Availability
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking: BookingData) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.cars?.title || 'Unknown Car'}</p>
                    <p className="text-sm text-muted-foreground">{booking.users?.full_name || 'Unknown User'}</p>
                  </div>
                  <Badge variant={
                    booking.status === 'confirmed' ? 'default' :
                    booking.status === 'pending' ? 'secondary' : 'outline'
                  }>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Available</span>
                </span>
                <span className="font-bold">{stats.carsAvailable}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-primary" />
                  <span>In Use</span>
                </span>
                <span className="font-bold">{stats.carsInUse}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span>Maintenance</span>
                </span>
                <span className="font-bold">{cars.length - stats.carsAvailable - stats.carsInUse}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCarsManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fleet Management</h3>
        <Button onClick={() => setShowAddCarModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Car
        </Button>
      </div>

      <div className="grid gap-4">
        {cars.map((car: CarData) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Car className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{car.model || car.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{car.location_city}</span>
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">₹{car.price_per_day}/day</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={
                      car.status === 'active' ? 'default' :
                      car.status === 'booked' ? 'secondary' : 'destructive'
                    }>
                      {car.status}
                    </Badge>
                    
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const AddCarModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Add New Car</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAddCarModal(false)}>✕</Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Car Model</Label>
              <Input
                value={newCar.model}
                onChange={(e) => setNewCar(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Honda City"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={newCar.location}
                onChange={(e) => setNewCar(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Banjara Hills"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Seats</Label>
              <Select value={newCar.seats.toString()} onValueChange={(value) => 
                setNewCar(prev => ({ ...prev, seats: parseInt(value) }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Seats</SelectItem>
                  <SelectItem value="5">5 Seats</SelectItem>
                  <SelectItem value="7">7 Seats</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price per Day</Label>
              <Input
                type="number"
                value={newCar.pricePerDay}
                onChange={(e) => setNewCar(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) }))}
                placeholder="1000"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fuel Type</Label>
              <Select value={newCar.fuel} onValueChange={(value) => 
                setNewCar(prev => ({ ...prev, fuel: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transmission</Label>
              <Select value={newCar.transmission} onValueChange={(value) => 
                setNewCar(prev => ({ ...prev, transmission: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Upload Images</Label>
            <div className="mt-2 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop images here or click to upload</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowAddCarModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddCarModal(false)}>
              Add Car
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">RP CARS Admin</h1>
              <p className="text-muted-foreground">Manage your fleet and bookings</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Exit Admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="promo">Promo Codes</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="cars" className="mt-6">
            {renderCarsManagement()}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="license" className="mt-6">
            <LicenseVerification />
          </TabsContent>

          <TabsContent value="promo" className="mt-6">
            <PromoCodeManagement />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceScheduler />
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityCompliance />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <FinancialManagement />
          </TabsContent>

          <TabsContent value="fleet" className="mt-6">
            <FleetOptimization />
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <CommunicationCenter />
          </TabsContent>
        </Tabs>
      </div>

      {showAddCarModal && <AddCarModal />}
    </div>
  );
};