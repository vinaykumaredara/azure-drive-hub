import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Users, Calendar, BarChart3, FileText, MessageCircle, Wrench, LogOut, ArrowLeft, CheckCircle, XCircle, AlertCircle, Search, RefreshCw, Eye, RotateCcw, Shield, Activity, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { 
  LazyAdminCarManagement, 
  LazyAdminBookingManagement, 
  LazyAnalyticsDashboard, 
  LazyPromoCodeManager, 
  LazyMaintenanceScheduler,
  LazyComponentWrapper,
  LazySystemSettings,
  LazySecurityCompliance
} from '@/components/LazyComponents';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from '@/hooks/usePerformanceOptimization';

// Enhanced Error Boundary Component
class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);
    toast({
      title: "Application Error",
      description: "An error occurred in the admin dashboard. Please refresh the page.",
      variant: "destructive",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => this.setState({ hasError: false })}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Fallback Component
const AdminLoadingFallback: React.FC<{ message?: string }> = ({ message = "Loading admin dashboard..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5 flex items-center justify-center">
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-accent-purple rounded-2xl flex items-center justify-center animate-pulse">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Admin Dashboard</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Enhanced License Management Component with Real-time Features and Performance Optimization
const LicenseManagement = React.memo(() => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Debounced search for better performance
  const debouncedSearch = useDebouncedCallback((term: string) => {
    setSearchTerm(term);
  }, 300);

  // Memoized filtered licenses
  const filteredLicenses = useMemo(() => {
    let filtered = licenses;
    
    if (searchTerm) {
      filtered = filtered.filter(license => 
        license.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.ocr_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(license => getStatus(license) === statusFilter);
    }
    
    return filtered;
  }, [licenses, searchTerm, statusFilter]);

  useEffect(() => {
    fetchLicenses();
    
    // Set up real-time subscription
    const licensesSubscription = supabase
      .channel('licenses')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'licenses' },
        (payload) => {
          console.log('License change detected:', payload);
          fetchLicenses(); // Refresh data
        }
      )
      .subscribe();
    
    return () => {
      licensesSubscription.unsubscribe();
    };
  }, []);

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          users (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load license verification requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (license: any) => {
    if (license.verified === true) {return 'verified';}
    if (license.verified === false) {return 'rejected';}
    if (license.verified === null) {
      if (license.ocr_confidence >= 0.9) {return 'pending-auto';}
      return 'pending';
    }
    return 'pending';
  };

  const updateLicenseStatus = async (licenseId: string, action: 'verify' | 'reject' | 'reset') => {
    setProcessingIds(prev => new Set([...prev, licenseId]));
    
    try {
      let verified = null;
      if (action === 'verify') {verified = true;}
      if (action === 'reject') {verified = false;}
      if (action === 'reset') {verified = null;}
      
      const { error } = await supabase
        .from('licenses')
        .update({ verified })
        .eq('id', licenseId);

      if (error) {throw error;}
      
      setLicenses(prev => prev.map(license => 
        license.id === licenseId ? { ...license, verified } : license
      ));
      
      const statusText = action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'reset to pending';
      toast({
        title: "Success",
        description: `License ${statusText} successfully`,
      });
    } catch (error) {
      console.error('Error updating license:', error);
      toast({
        title: "Error",
        description: "Failed to update license status",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(licenseId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending-auto': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending-auto': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'pending-auto': return 'Auto-Review';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getSignedUrl = async (storagePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('license-uploads')
        .createSignedUrl(storagePath, 3600);
      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/admin')}
          className="hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">License Management</h2>
      </div>
      
      {isLoading ? (
        <AdminLoadingFallback message="Loading license verification requests..." />
      ) : licenses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No License Requests</h3>
          <p className="text-muted-foreground">
            No users have uploaded their licenses for verification yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, ID, or OCR text..."
                  onChange={(e) => debouncedSearch(e.target.value)}
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
                  <SelectItem value="pending-auto">Auto-Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchLicenses} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-4">
            {filteredLicenses.map((license) => {
              const status = getStatus(license);
              const isProcessing = processingIds.has(license.id);
              
              return (
                <Card key={license.id} className="p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6 flex-1">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20">
                        {license.storage_path ? (
                          <div 
                            className="w-full h-full flex items-center justify-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={async () => {
                              const url = await getSignedUrl(license.storage_path);
                              if (url) {window.open(url, '_blank');}
                            }}
                          >
                            <Eye className="h-6 w-6 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {license.users?.full_name || 'Unknown User'}
                          </h3>
                          <Badge className={`${getStatusColor(status)} flex items-center gap-1 border`}>
                            {getStatusIcon(status)}
                            {getStatusText(status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="ml-2 font-medium">{license.users?.phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Uploaded:</span>
                            <span className="ml-2">{new Date(license.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {(status === 'pending' || status === 'pending-auto') && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateLicenseStatus(license.id, 'verify')}
                            disabled={isProcessing}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            {isProcessing ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1">Verify</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateLicenseStatus(license.id, 'reject')}
                            disabled={isProcessing}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isProcessing ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1">Reject</span>
                          </Button>
                        </>
                      )}
                      
                      {(status === 'verified' || status === 'rejected') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateLicenseStatus(license.id, 'reset')}
                          disabled={isProcessing}
                          className="text-muted-foreground hover:text-primary"
                        >
                          {isProcessing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          <span className="ml-1">Reset</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    totalCars: 0,
    activeBookings: 0,
    revenueToday: 0,
    totalCustomers: 0,
    pendingLicenses: 0,
    activePromos: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      // Fetch all stats in parallel
      const [
        { count: totalCars },
        { count: activeBookings },
        { count: totalCustomers },
        { count: pendingLicenses },
        { count: activePromos },
        { data: todayRevenue }
      ] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'active']),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_admin', false),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).is('verified', null),
        supabase.from('promo_codes').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfToday)
      ]);

      const revenueToday = todayRevenue?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setDashboardStats({
        totalCars: totalCars || 0,
        activeBookings: activeBookings || 0,
        revenueToday,
        totalCustomers: totalCustomers || 0,
        pendingLicenses: pendingLicenses || 0,
        activePromos: activePromos || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const quickStats = [
    { title: 'Total Cars', value: dashboardStats.totalCars.toString(), icon: Car, color: 'text-primary', trend: '+12%' },
    { title: 'Active Bookings', value: dashboardStats.activeBookings.toString(), icon: Calendar, color: 'text-success', trend: '+5%' },
    { title: 'Revenue Today', value: `₹${dashboardStats.revenueToday.toLocaleString()}`, icon: BarChart3, color: 'text-warning', trend: '+18%' },
    { title: 'Customers', value: dashboardStats.totalCustomers.toString(), icon: Users, color: 'text-accent-purple', trend: '+23%' },
    { title: 'Pending Licenses', value: dashboardStats.pendingLicenses.toString(), icon: FileText, color: 'text-orange-600', trend: '-2%' },
    { title: 'Active Promos', value: dashboardStats.activePromos.toString(), icon: MessageCircle, color: 'text-pink-600', trend: '+1%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5">
      <header className="bg-white/90 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">RP CARS Admin</h1>
                <p className="text-sm text-muted-foreground">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email?.split('@')[0]}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <div className="flex items-center mt-1">
                              <span className={`text-xs font-medium ${
                                stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stat.trend}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">vs last week</span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color.includes('primary') ? 'from-blue-100 to-blue-200' : 
                            stat.color.includes('success') ? 'from-green-100 to-green-200' :
                            stat.color.includes('warning') ? 'from-yellow-100 to-yellow-200' :
                            stat.color.includes('purple') ? 'from-purple-100 to-purple-200' :
                            stat.color.includes('orange') ? 'from-orange-100 to-orange-200' :
                            'from-pink-100 to-pink-200'}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/cars')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Car className="h-6 w-6 text-primary" />
                        </div>
                        Car Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Add, edit, and manage your car inventory with photos and specifications.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{dashboardStats.totalCars} active vehicles</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Updated daily</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/bookings')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                          <Calendar className="h-6 w-6 text-success" />
                        </div>
                        Booking Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">View and manage customer bookings, confirmations, and cancellations.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{dashboardStats.activeBookings} active bookings</span>
                        <span className="mx-2">•</span>
                        <span className="text-yellow-600">Real-time updates</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/analytics')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
                          <BarChart3 className="h-6 w-6 text-warning" />
                        </div>
                        Analytics & Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Revenue reports, performance analytics, and business insights.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>$12,450 this month</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">+18% growth</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/licenses')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-lg group-hover:bg-accent-purple/20 transition-colors">
                          <FileText className="h-6 w-6 text-accent-purple" />
                        </div>
                        License Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Review and verify customer driver's licenses with AI assistance.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>156 verified licenses</span>
                        <span className="mx-2">•</span>
                        <span className="text-orange-600">3 pending review</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/promos')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                          <MessageCircle className="h-6 w-6 text-pink-600" />
                        </div>
                        Promo Codes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Create and manage promotional discount codes and campaigns.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>5 active campaigns</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">127 redeemed</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/maintenance')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <Wrench className="h-6 w-6 text-slate-600" />
                        </div>
                        Maintenance Scheduler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Schedule and track vehicle maintenance, inspections, and repairs.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>2 due this week</span>
                        <span className="mx-2">•</span>
                        <span className="text-blue-600">5 scheduled</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Admin Features */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <Users className="h-6 w-6 text-emerald-600" />
                        </div>
                        Customer Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Manage customer accounts, support tickets, and communication.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>156 total customers</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">12 new this week</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/settings')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                          <Settings className="h-6 w-6 text-indigo-600" />
                        </div>
                        System Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Configure system settings, payments, notifications, and preferences.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>All systems operational</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">99.8% uptime</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift group" onClick={() => navigate('/admin/security')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                          <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        Security & Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">Monitor security, audit logs, and ensure regulatory compliance.</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>Security score: 98%</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Compliant</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          } />
          <Route path="/cars" element={
            <LazyComponentWrapper>
              <LazyAdminCarManagement />
            </LazyComponentWrapper>
          } />
          <Route path="/bookings" element={
            <LazyComponentWrapper>
              <LazyAdminBookingManagement />
            </LazyComponentWrapper>
          } />
          <Route path="/analytics" element={
            <LazyComponentWrapper>
              <LazyAnalyticsDashboard />
            </LazyComponentWrapper>
          } />
          <Route path="/licenses" element={<LicenseManagement />} />
          <Route path="/promos" element={
            <LazyComponentWrapper>
              <LazyPromoCodeManager />
            </LazyComponentWrapper>
          } />
          <Route path="/maintenance" element={
            <LazyComponentWrapper>
              <LazyMaintenanceScheduler />
            </LazyComponentWrapper>
          } />
          <Route path="/settings" element={
            <LazyComponentWrapper>
              <LazySystemSettings />
            </LazyComponentWrapper>
          } />
          <Route path="/security" element={
            <LazyComponentWrapper>
              <LazySecurityCompliance />
            </LazyComponentWrapper>
          } />
        </Routes>
      </main>
    </div>
  );
};

const EnhancedAdminDashboard: React.FC = () => {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminDashboard />
      </Suspense>
    </AdminErrorBoundary>
  );
};

export default EnhancedAdminDashboard;