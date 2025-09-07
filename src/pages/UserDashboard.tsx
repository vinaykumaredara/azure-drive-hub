import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Car, FileText, MessageCircle, Settings, LogOut, User, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LicenseUpload } from '@/components/LicenseUpload';
import { ChatWidget } from '@/components/ChatWidget';

interface Booking {
  id: string;
  car_id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_amount: number;
  cars?: {
    title: string;
    make: string;
    model: string;
    image_urls: string[];
  };
}

const UserDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
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

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
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

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    My Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No bookings yet</p>
                      <Button className="mt-4" onClick={() => window.location.href = '/'}>
                        Browse Cars
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-4">
                            {booking.cars?.image_urls?.[0] && (
                              <img
                                src={booking.cars.image_urls[0]}
                                alt={booking.cars.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold">
                                {booking.cars?.title || 'Car Booking'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(booking.start_datetime).toLocaleDateString()} - {' '}
                                {new Date(booking.end_datetime).toLocaleDateString()}
                              </p>
                              <p className="text-sm font-medium">
                                ${booking.total_amount}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  </div>
                </CardContent>
              </Card>
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
                  <LicenseUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChatWidget roomId={`support:${user?.id}`} />
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