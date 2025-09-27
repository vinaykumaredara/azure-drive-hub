import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, Calendar, DollarSign, Settings, Plus, 
  Edit, Trash2, Eye, BarChart3, Bell, Upload,
  CheckCircle, XCircle, Clock, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const mockStats = {
  totalCars: 24,
  activeBookings: 18,
  monthlyRevenue: 45000,
  totalUsers: 156,
  carsAvailable: 15,
  carsInUse: 9,
  pendingBookings: 3,
  completedBookings: 142
};

const mockCars = [
  {
    id: '1',
    model: 'Honda City',
    status: 'available',
    location: 'Banjara Hills',
    pricePerDay: 1200,
    bookings: 24,
    rating: 4.8,
    lastService: '2024-01-15'
  },
  {
    id: '2', 
    model: 'Hyundai Creta',
    status: 'booked',
    location: 'HITEC City',
    pricePerDay: 2200,
    bookings: 18,
    rating: 4.9,
    lastService: '2024-01-10'
  },
  {
    id: '3',
    model: 'Maruti Swift',
    status: 'maintenance',
    location: 'Secunderabad',
    pricePerDay: 999,
    bookings: 31,
    rating: 4.6,
    lastService: '2024-01-20'
  }
];

const mockBookings = [
  {
    id: 'BK001',
    car: 'Honda City',
    user: 'Rajesh Kumar',
    startDate: '2024-02-01',
    endDate: '2024-02-03',
    status: 'confirmed',
    amount: 3600,
    holdExpiry: null
  },
  {
    id: 'BK002',
    car: 'Hyundai Creta', 
    user: 'Priya Sharma',
    startDate: '2024-02-02',
    endDate: '2024-02-04',
    status: 'pending',
    amount: 4400,
    holdExpiry: '2024-01-31T15:30:00Z'
  },
  {
    id: 'BK003',
    car: 'Maruti Swift',
    user: 'Amit Patel',
    startDate: '2024-01-28',
    endDate: '2024-01-30',
    status: 'completed',
    amount: 1998,
    holdExpiry: null
  }
];

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
          value={mockStats.totalCars}
          change={12}
        />
        <StatCard
          icon={Calendar}
          title="Active Bookings"
          value={mockStats.activeBookings}
          change={8}
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`₹${mockStats.monthlyRevenue.toLocaleString()}`}
          change={15}
        />
        <StatCard
          icon={Users}
          title="Total Users"
          value={mockStats.totalUsers}
          change={22}
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
              {mockBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.car}</p>
                    <p className="text-sm text-muted-foreground">{booking.user}</p>
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
                <span className="font-bold">{mockStats.carsAvailable}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-primary" />
                  <span>In Use</span>
                </span>
                <span className="font-bold">{mockStats.carsInUse}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span>Maintenance</span>
                </span>
                <span className="font-bold">3</span>
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
        {mockCars.map((car) => (
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
                      <h4 className="font-semibold">{car.model}</h4>
                      <p className="text-sm text-muted-foreground flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{car.location}</span>
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">₹{car.pricePerDay}/day</span>
                        <span className="text-sm">⭐ {car.rating}</span>
                        <span className="text-sm">{car.bookings} bookings</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={
                      car.status === 'available' ? 'default' :
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

  const renderBookingsManagement = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Booking Management</h3>

      <div className="grid gap-4">
        {mockBookings.map((booking) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{booking.id}</h4>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'pending' ? 'secondary' : 'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.user} • {booking.car}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.startDate} to {booking.endDate}
                    </p>
                    {booking.holdExpiry && (
                      <p className="text-xs text-warning mt-1 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Hold expires: {new Date(booking.holdExpiry).toLocaleTimeString()}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">₹{booking.amount.toLocaleString()}</p>
                    <div className="flex space-x-2 mt-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">Approve</Button>
                          <Button size="sm" variant="destructive">Cancel</Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button size="sm" variant="outline">Manage</Button>
                      )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cars">Cars</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="cars" className="mt-6">
            {renderCarsManagement()}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {renderBookingsManagement()}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">Advanced analytics and reports coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showAddCarModal && <AddCarModal />}
    </div>
  );
};