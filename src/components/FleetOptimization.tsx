import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Fuel, 
  TrendingUp, 
  Calendar, 
  Filter, 
  BarChart3, 
  Navigation,
  Zap,
  Car,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatINRFromPaise } from '@/utils/currency';

interface FleetVehicle {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  location_city: string | null;
  status: string | null;
  price_per_day: number;
  fuel_type: string | null;
  transmission: string | null;
  bookings_count: number;
  utilization_rate: number;
  last_service_date: string | null;
  next_service_date: string | null;
  fuel_efficiency: number | null; // km per liter
  current_location: string | null;
  last_updated: string;
}

interface LocationData {
  city: string;
  vehicle_count: number;
  utilization_rate: number;
  revenue: number;
}

const FleetOptimization: React.FC = () => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('utilization_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockVehicles: FleetVehicle[] = [
        {
          id: '1',
          title: 'Honda City 2023',
          make: 'Honda',
          model: 'City',
          year: 2023,
          location_city: 'Mumbai',
          status: 'available',
          price_per_day: 320000, // in paise
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          bookings_count: 42,
          utilization_rate: 78,
          last_service_date: '2025-09-15',
          next_service_date: '2025-12-15',
          fuel_efficiency: 18.5,
          current_location: 'Mumbai Central',
          last_updated: '2025-09-28T10:30:00Z'
        },
        {
          id: '2',
          title: 'Hyundai Creta 2022',
          make: 'Hyundai',
          model: 'Creta',
          year: 2022,
          location_city: 'Delhi',
          status: 'booked',
          price_per_day: 350000, // in paise
          fuel_type: 'Diesel',
          transmission: 'Manual',
          bookings_count: 38,
          utilization_rate: 82,
          last_service_date: '2025-09-10',
          next_service_date: '2025-12-10',
          fuel_efficiency: 21.3,
          current_location: 'Delhi Airport',
          last_updated: '2025-09-28T09:15:00Z'
        },
        {
          id: '3',
          title: 'Maruti Swift 2023',
          make: 'Maruti',
          model: 'Swift',
          year: 2023,
          location_city: 'Bangalore',
          status: 'maintenance',
          price_per_day: 250000, // in paise
          fuel_type: 'Petrol',
          transmission: 'Manual',
          bookings_count: 56,
          utilization_rate: 91,
          last_service_date: '2025-09-20',
          next_service_date: '2026-03-20',
          fuel_efficiency: 22.0,
          current_location: 'Bangalore Service Center',
          last_updated: '2025-09-28T11:45:00Z'
        },
        {
          id: '4',
          title: 'Toyota Innova 2021',
          make: 'Toyota',
          model: 'Innova',
          year: 2021,
          location_city: 'Chennai',
          status: 'available',
          price_per_day: 520000, // in paise
          fuel_type: 'Diesel',
          transmission: 'Manual',
          bookings_count: 29,
          utilization_rate: 65,
          last_service_date: '2025-08-28',
          next_service_date: '2025-11-28',
          fuel_efficiency: 12.8,
          current_location: 'Chennai Central',
          last_updated: '2025-09-28T08:30:00Z'
        }
      ];

      const mockLocations: LocationData[] = [
        {
          city: 'Mumbai',
          vehicle_count: 12,
          utilization_rate: 72,
          revenue: 4500000 // in paise
        },
        {
          city: 'Delhi',
          vehicle_count: 8,
          utilization_rate: 78,
          revenue: 3200000 // in paise
        },
        {
          city: 'Bangalore',
          vehicle_count: 10,
          utilization_rate: 85,
          revenue: 3800000 // in paise
        },
        {
          city: 'Chennai',
          vehicle_count: 7,
          utilization_rate: 68,
          revenue: 2800000 // in paise
        }
      ];

      setVehicles(mockVehicles);
      setLocations(mockLocations);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles;
    
    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (locationFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.location_city === locationFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof FleetVehicle];
      const bVal = b[sortBy as keyof FleetVehicle];
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [vehicles, searchTerm, locationFilter, statusFilter, sortBy, sortOrder]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(vehicles.map(vehicle => vehicle.location_city).filter(Boolean))) as string[];
  }, [vehicles]);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'booked': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  // Get efficiency rating
  const getEfficiencyRating = (efficiency: number | null) => {
    if (!efficiency) return 'N/A';
    if (efficiency >= 20) return 'Excellent';
    if (efficiency >= 15) return 'Good';
    if (efficiency >= 10) return 'Average';
    return 'Poor';
  };

  // Get efficiency color
  const getEfficiencyColor = (efficiency: number | null) => {
    if (!efficiency) return 'text-muted-foreground';
    if (efficiency >= 20) return 'text-green-600';
    if (efficiency >= 15) return 'text-blue-600';
    if (efficiency >= 10) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-3xl font-bold">Fleet Optimization</h1>
          <p className="text-muted-foreground">Track vehicle performance and optimize fleet operations</p>
        </div>
        <Button>
          <Navigation className="w-4 h-4 mr-2" />
          Optimize Routes
        </Button>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold">{vehicles.length}</p>
              </div>
              <Car className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Utilization</p>
                <p className="text-2xl font-bold">
                  {vehicles.length > 0 
                    ? Math.round(vehicles.reduce((sum, v) => sum + v.utilization_rate, 0) / vehicles.length) 
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Utilization</p>
                <p className="text-2xl font-bold">
                  {vehicles.filter(v => v.utilization_rate > 80).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">
                  {vehicles.filter(v => v.utilization_rate < 50 || v.status === 'maintenance').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {locations.map((location, index) => (
              <motion.div
                key={location.city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{location.city}</h3>
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Vehicles</span>
                        <span className="font-medium">{location.vehicle_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Utilization</span>
                        <span className="font-medium">{location.utilization_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formatINRFromPaise(location.revenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilization_rate">Utilization</SelectItem>
                  <SelectItem value="bookings_count">Bookings</SelectItem>
                  <SelectItem value="fuel_efficiency">Fuel Efficiency</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
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
                      <div>
                        <h3 className="font-semibold text-lg truncate">{vehicle.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusVariant(vehicle.status || '')}>
                            {getStatusText(vehicle.status || '')}
                          </Badge>
                          <Badge variant="secondary">{vehicle.location_city}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatINRFromPaise(vehicle.price_per_day)}/day</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Fuel className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{vehicle.fuel_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Utilization Rate</p>
                        <p className="font-medium">{vehicle.utilization_rate}%</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${vehicle.utilization_rate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                        <p className="font-medium">{vehicle.bookings_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fuel Efficiency</p>
                        <p className={`font-medium ${getEfficiencyColor(vehicle.fuel_efficiency)}`}>
                          {vehicle.fuel_efficiency ? `${vehicle.fuel_efficiency} km/l` : 'N/A'}
                          {vehicle.fuel_efficiency && (
                            <span className="text-xs ml-1">({getEfficiencyRating(vehicle.fuel_efficiency)})</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Service</p>
                        <p className="font-medium">
                          {vehicle.next_service_date 
                            ? new Date(vehicle.next_service_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{vehicle.current_location}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Navigation className="w-4 h-4 mr-1" />
                          Track
                        </Button>
                        <Button variant="outline" size="sm">
                          Optimize
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Predictive Maintenance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Predictive Maintenance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vehicles
              .filter(vehicle => 
                vehicle.utilization_rate > 85 || 
                (vehicle.next_service_date && 
                 new Date(vehicle.next_service_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
              )
              .map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">{vehicle.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.utilization_rate > 85 
                          ? `High utilization (${vehicle.utilization_rate}%) - Consider maintenance` 
                          : `Service due soon - ${new Date(vehicle.next_service_date || '').toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Schedule</Button>
                </div>
              ))
            }
            
            {vehicles.filter(vehicle => 
              vehicle.utilization_rate > 85 || 
              (vehicle.next_service_date && 
               new Date(vehicle.next_service_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            ).length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No maintenance alerts at this time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetOptimization;