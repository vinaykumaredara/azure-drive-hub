import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Car, FileText, MessageCircle, Settings, LogOut, User, CreditCard, Heart, MapPin, Clock, Star, Award, Bell, Download, Share2, Filter, Search, TrendingUp, Shield, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LazyLicenseUpload, LazyChatWidget } from '@/components/LazyComponents';
import { errorLogger } from '@/utils/errorLogger';

interface Booking {
  id: string;
  car_id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_amount: number;
  created_at: string;
  cars?: {
    title: string;
    make: string;
    model: string;
    image_urls: string[];
    rating?: number;
  };
}

interface UserStats {
  totalBookings: number;
  totalSpent: number;
  favoriteCarType: string;
  membershipLevel: string;
  loyaltyPoints: number;
  co2Saved: number;
}

const UserDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteCarIds, setFavoriteCarIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserBookings(),
        fetchUserStats(),
        fetchNotifications(),
        fetchFavorites()
      ]).catch(error => {
        console.error('Dashboard data fetch error:', error);
        toast({
          title: "Dashboard Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [user]);

  const fetchUserBookings = async () => {
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
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      setBookings(data || []);
    } catch (error) {
      errorLogger.logError(error as Error, {
        component: 'UserDashboard',
        action: 'fetchUserBookings',
        userId: user?.id
      });
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Calculate user statistics
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('total_amount, status, cars(make)')
        .eq('user_id', user?.id);
      
      if (bookingsData) {
        const totalBookings = bookingsData.length;
        const totalSpent = bookingsData.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const carMakes = bookingsData.map(b => b.cars?.make).filter(Boolean);
        const favoriteCarType = carMakes.length > 0 
          ? carMakes.sort((a, b) => 
              carMakes.filter(v => v === a).length - carMakes.filter(v => v === b).length
            ).pop() || 'N/A'
          : 'N/A';
        
        const membershipLevel = totalSpent > 1000 ? 'Gold' : totalSpent > 500 ? 'Silver' : 'Bronze';
        const loyaltyPoints = Math.floor(totalSpent / 10);
        const co2Saved = totalBookings * 2.3; // Estimated CO2 saved per booking
        
        setUserStats({
          totalBookings,
          totalSpent,
          favoriteCarType,
          membershipLevel,
          loyaltyPoints,
          co2Saved
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Generate dynamic notifications based on user data
      const notifications = [];
      
      // Check if user needs to upload license
      const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (!license) {
        notifications.push({
          id: 1,
          title: 'Upload Your License',
          message: 'Upload your driving license to start booking cars',
          type: 'warning',
          time: 'Pending',
          created_at: new Date().toISOString()
        });
      } else if (license.verified === null) {
        notifications.push({
          id: 2,
          title: 'License Under Review',
          message: 'Your license is being verified. This usually takes 1-2 hours.',
          type: 'info',
          time: new Date(license.created_at).toLocaleDateString(),
          created_at: license.created_at
        });
      } else if (license.verified === true) {
        notifications.push({
          id: 3,
          title: 'License Verified!',
          message: 'Your driving license has been verified. You can now book cars.',
          type: 'success',
          time: new Date(license.created_at).toLocaleDateString(),
          created_at: license.created_at
        });
      }
      
      // Check for recent bookings
      if (bookings.length > 0) {
        const recentBooking = bookings[0];
        const bookingDate = new Date(recentBooking.start_datetime);
        const now = new Date();
        const diffTime = bookingDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 1) {
          notifications.push({
            id: 4,
            title: 'Upcoming Booking',
            message: `Your booking for ${recentBooking.cars?.title} starts ${diffDays === 0 ? 'today' : 'tomorrow'}`,
            type: 'info',
            time: bookingDate.toLocaleDateString(),
            created_at: recentBooking.created_at
          });
        }
      }
      
      // Add welcome message if no other notifications
      if (notifications.length === 0) {
        notifications.push({
          id: 5,
          title: 'Welcome to Azure Drive Hub!',
          message: 'Explore our premium fleet and start your journey',
          type: 'success',
          time: 'Welcome',
          created_at: new Date().toISOString()
        });
      }
      
      setNotifications(notifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      // Fallback notification
      setNotifications([{
        id: 1,
        title: 'Welcome!',
        message: 'Welcome to Azure Drive Hub',
        type: 'info',
        time: 'Now',
        created_at: new Date().toISOString()
      }]);
    }
  };

  const fetchFavorites = async () => {
    // For now, use local storage for favorites until user_favorites table is created
    try {
      const savedFavorites = localStorage.getItem(`favorites_${user?.id}`);
      if (savedFavorites) {
        setFavoriteCarIds(JSON.parse(savedFavorites));
      } else {
        setFavoriteCarIds([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteCarIds([]);
    }
  };

  const toggleFavorite = (carId: string) => {
    const newFavorites = favoriteCarIds.includes(carId) 
      ? favoriteCarIds.filter(id => id !== carId)
      : [...favoriteCarIds, carId];
    
    setFavoriteCarIds(newFavorites);
    
    // Save to localStorage
    try {
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
    
    toast({
      title: "Favorites Updated",
      description: "Your favorite cars have been updated",
    });
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
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'success': return <Gift className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.cars?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.cars?.make?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadBookingHistory = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Car,Start Date,End Date,Status,Amount\n" +
      bookings.map(b => 
        `${b.cars?.title},${b.start_datetime},${b.end_datetime},${b.status},$${b.total_amount}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "booking_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Complete",
      description: "Your booking history has been downloaded",
    });
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: 'RP CARS Profile',
        text: `Check out my car rental profile! ${userStats?.totalBookings} bookings completed.`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation is now handled by the auth listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-accent-purple/5">
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">RP CARS</h1>
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="ghost" size="sm" disabled>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Welcome back!</h2>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-accent-purple/5">
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">RP CARS</h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Welcome back!</h2>
              <p className="text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
              <TabsTrigger value="notifications">Alerts</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold">{userStats?.totalBookings || 0}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold">${userStats?.totalSpent || 0}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                        <p className="text-2xl font-bold">{userStats?.loyaltyPoints || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">CO₂ Saved</p>
                        <p className="text-2xl font-bold">{userStats?.co2Saved?.toFixed(1) || 0}kg</p>
                      </div>
                      <Shield className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Membership Level */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Current Level: {userStats?.membershipLevel || 'Bronze'}</span>
                      <Badge variant="outline" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                        {userStats?.membershipLevel || 'Bronze'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress to next level</span>
                        <span>{Math.min(100, ((userStats?.totalSpent || 0) % 500) / 5)}%</span>
                      </div>
                      <Progress value={Math.min(100, ((userStats?.totalSpent || 0) % 500) / 5)} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Spend ${500 - ((userStats?.totalSpent || 0) % 500)} more to reach the next level!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking, index) => (
                      <div key={booking.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Booked {booking.cars?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Favorite Cars
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteCarIds.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No favorite cars yet</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>
                        Browse Cars
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favoriteCarIds.map((carId, index) => (
                        <div key={carId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">Favorite Car #{index + 1}</h3>
                              <p className="text-sm text-muted-foreground">Premium Vehicle</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleFavorite(carId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      My Bookings
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadBookingHistory}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareProfile}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your search'}
                      </p>
                      <Button className="mt-4" onClick={() => navigate('/')}>
                        Browse Cars
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-muted/10"
                        >
                          <div className="flex items-center space-x-4">
                            {booking.cars?.image_urls?.[0] && (
                              <div className="relative">
                                <img
                                  src={booking.cars.image_urls[0]}
                                  alt={booking.cars.title}
                                  className="w-20 h-20 object-cover rounded-lg shadow-md"
                                  loading="lazy"
                                />
                                <div className="absolute -top-1 -right-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-white shadow-md rounded-full"
                                    onClick={() => booking.car_id && toggleFavorite(booking.car_id)}
                                  >
                                    <Heart 
                                      className={`h-3 w-3 ${
                                        favoriteCarIds.includes(booking.car_id) 
                                          ? 'text-red-500 fill-current' 
                                          : 'text-muted-foreground'
                                      }`} 
                                    />
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {booking.cars?.title || 'Car Booking'}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{booking.cars?.make} {booking.cars?.model}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {new Date(booking.start_datetime).toLocaleDateString()} - {' '}
                                    {new Date(booking.end_datetime).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">
                                  ${booking.total_amount}
                                </span>
                                {booking.cars?.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{booking.cars.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {booking.status === 'completed' && (
                                <Button variant="outline" size="sm">
                                  <Star className="h-3 w-3 mr-1" />
                                  Rate
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Member Since</label>
                        <p className="text-muted-foreground">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Favorite Car Type</label>
                        <p className="text-muted-foreground">{userStats?.favoriteCarType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Account Status</label>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button className="w-full" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">First Booking</p>
                            <p className="text-xs text-muted-foreground">Completed your first rental</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Earned</Badge>
                      </div>
                      
                      {(userStats?.totalBookings || 0) >= 5 && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Star className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Frequent Renter</p>
                              <p className="text-xs text-muted-foreground">5+ bookings completed</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Earned</Badge>
                        </div>
                      )}
                      
                      {(userStats?.totalSpent || 0) >= 1000 && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">Big Spender</p>
                              <p className="text-xs text-muted-foreground">$1000+ total spent</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Earned</Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Eco Warrior</p>
                            <p className="text-xs text-muted-foreground">Helped save {userStats?.co2Saved?.toFixed(1) || 0}kg CO₂</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="licenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Driver's Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyLicenseUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Support & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* WhatsApp Contact Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">WhatsApp Support</h3>
                        <p className="text-sm text-muted-foreground">Get instant help via WhatsApp</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => {
                          const text = encodeURIComponent("Hello Azure Drive Hub! I need support with my booking. Please help me.");
                          const waUrl = `https://wa.me/918897072640?text=${text}`;
                          window.open(waUrl, "_blank");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const text = encodeURIComponent(`Hello Azure Drive Hub! I'm ${user?.email} and I have a question about my account.`);
                          const waUrl = `https://wa.me/918897072640?text=${text}`;
                          window.open(waUrl, "_blank");
                        }}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account Help
                      </Button>
                    </div>
                    <div className="mt-4 p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Available 24/7 • Response time: Usually within 5 minutes</span>
                      </p>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Emergency Contact</h3>
                        <p className="text-sm text-muted-foreground">For urgent assistance</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        window.location.href = "tel:+918897072640";
                      }}
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      📞 Call +91 8897072640
                    </Button>
                  </div>

                  {/* Live Chat */}
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Live Chat
                      </h3>
                      <p className="text-sm text-muted-foreground">Chat with our support team</p>
                    </div>
                    <div className="p-4">
                      <LazyChatWidget roomId={`support:${user?.id}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default UserDashboard;