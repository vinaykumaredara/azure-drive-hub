import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Car, Award, TrendingUp, Shield, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserStats, Notification } from '@/types/dashboard.types';
import { formatINRFromPaise } from '@/utils/currency';

interface UserDashboardOverviewProps {
  userStats: UserStats | null;
  notifications: Notification[];
  isLoading: boolean;
}

export const UserDashboardOverview: React.FC<UserDashboardOverviewProps> = ({
  userStats,
  notifications,
  isLoading
}) => {
  // Memoize sorted notifications
  const sortedNotifications = useMemo(() => 
    [...notifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [notifications]
  );

  const statCards = useMemo(() => [
    { icon: Car, label: 'Total Bookings', value: userStats?.totalBookings || 0, color: 'text-blue-600' },
    { icon: TrendingUp, label: 'Total Spent', value: formatINRFromPaise((userStats?.totalSpent || 0) * 100), color: 'text-green-600' },
    { icon: Award, label: 'Loyalty Points', value: userStats?.loyaltyPoints || 0, color: 'text-yellow-600' },
    { icon: Shield, label: 'Membership', value: userStats?.membershipLevel || 'Bronze', color: 'text-purple-600' },
  ], [userStats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <Badge variant={notification.type === 'success' ? 'default' : notification.type === 'warning' ? 'destructive' : 'secondary'}>
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      {userStats && userStats.co2Saved > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">CO₂ Saved</span>
                  <span className="text-sm font-medium">{userStats.co2Saved.toFixed(1)} kg</span>
                </div>
                <Progress value={(userStats.co2Saved / 100) * 100} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                By using our car rental service, you've helped reduce carbon emissions by {userStats.co2Saved.toFixed(1)} kg!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
