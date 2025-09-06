import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Car, 
  Users, 
  IndianRupee, 
  Calendar,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AnalyticsData {
  overview: {
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalCars: number;
    totalUsers: number;
    conversionRate: string;
  };
  chartData: Array<{
    date: string;
    bookings: number;
    revenue: number;
    confirmed: number;
  }>;
  popularCars: Array<{
    car_id: string;
    cars: {
      title: string;
      make: string;
      model: string;
    };
    count: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analytics-data", {
        body: { period: selectedPeriod }
      });

      if (error) throw error;

      setAnalyticsData(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast({
        title: "Failed to load analytics",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B'];

  const StatCard = ({ title, value, icon: Icon, change, color = "primary" }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    change?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground">
                <span className={change.startsWith('+') ? "text-success" : "text-destructive"}>
                  {change}
                </span>
                {" from last period"}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="animate-pulse h-10 w-32 bg-muted rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={analyticsData.overview.totalBookings}
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Confirmed Bookings"
          value={analyticsData.overview.confirmedBookings}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.overview.totalRevenue)}
          icon={IndianRupee}
          color="accent-purple"
        />
        <StatCard
          title="Conversion Rate"
          value={`${analyticsData.overview.conversionRate}%`}
          icon={BarChart3}
          color="warning"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Cars"
          value={analyticsData.overview.totalCars}
          icon={Car}
          color="primary"
        />
        <StatCard
          title="Total Users"
          value={analyticsData.overview.totalUsers}
          icon={Users}
          color="secondary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  name="Total Bookings"
                />
                <Line 
                  type="monotone" 
                  dataKey="confirmed" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Confirmed Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Popular Cars */}
      {analyticsData.popularCars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {analyticsData.popularCars.map((car, index) => (
                  <div key={car.car_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{car.cars.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {car.cars.make} {car.cars.model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{car.count}</p>
                      <p className="text-xs text-muted-foreground">bookings</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.popularCars}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="cars.title"
                  >
                    {analyticsData.popularCars.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, "bookings"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};