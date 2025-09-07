import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Users, Calendar, BarChart3, Settings, FileText, MessageCircle, Wrench, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import AdminCarManagement from '@/components/AdminCarManagement';
import AdminBookingManagement from '@/components/AdminBookingManagement';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { PromoCodeManager } from '@/components/PromoCodeManager';
import { MaintenanceScheduler } from '@/components/MaintenanceScheduler';

// License Management Component
const LicenseManagement = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">License Management</h2>
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">License review functionality will be available soon.</p>
      </div>
    </div>
  );
};
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const quickStats = [
    { title: 'Total Cars', value: '24', icon: Car, color: 'text-primary' },
    { title: 'Active Bookings', value: '8', icon: Calendar, color: 'text-success' },
    { title: 'Revenue Today', value: '$1,240', icon: BarChart3, color: 'text-warning' },
    { title: 'Customers', value: '156', icon: Users, color: 'text-accent-purple' },
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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          </div>
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Management Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift" 
                        onClick={() => navigate('/admin/cars')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Car className="h-6 w-6 text-primary" />
                        </div>
                        Car Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Add, edit, and manage your car inventory with photos and specifications.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() => navigate('/admin/bookings')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Calendar className="h-6 w-6 text-success" />
                        </div>
                        Booking Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        View and manage customer bookings, confirmations, and cancellations.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() => navigate('/admin/analytics')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-warning" />
                        </div>
                        Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Revenue reports and performance analytics.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() => navigate('/admin/licenses')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-lg">
                          <FileText className="h-6 w-6 text-accent-purple" />
                        </div>
                        License Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Review and verify customer driver's licenses.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() => navigate('/admin/promos')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-destructive" />
                        </div>
                        Promo Codes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Create and manage promotional discount codes.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift"
                        onClick={() => navigate('/admin/maintenance')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <Wrench className="h-6 w-6 text-muted-foreground" />
                        </div>
                        Maintenance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Schedule and track vehicle maintenance.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          } />
          <Route path="/cars" element={<AdminCarManagement />} />
          <Route path="/bookings" element={<AdminBookingManagement />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/licenses" element={<LicenseManagement />} />
          <Route path="/promos" element={<PromoCodeManager />} />
          <Route path="/maintenance" element={<MaintenanceScheduler />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;