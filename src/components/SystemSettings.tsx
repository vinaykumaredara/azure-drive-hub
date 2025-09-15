import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, ArrowLeft, Save, Bell, CreditCard, Mail, MapPin, 
  Palette, Globe, Shield, Database, Clock, Zap 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SystemSettings {
  general: {
    company_name: string;
    company_email: string;
    company_phone: string;
    company_address: string;
    business_hours: string;
    currency: string;
    timezone: string;
  };
  payment: {
    razorpay_key_id: string;
    razorpay_key_secret: string;
    payment_processing_fee: number;
    auto_refund_enabled: boolean;
    payment_timeout: number;
  };
  notification: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    booking_confirmations: boolean;
    payment_alerts: boolean;
    maintenance_reminders: boolean;
  };
  booking: {
    advance_booking_days: number;
    min_booking_hours: number;
    cancellation_window: number;
    late_return_penalty: number;
    fuel_charge_per_km: number;
    driver_age_minimum: number;
  };
}

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Settings state
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      company_name: 'Azure Drive Hub',
      company_email: 'info@azuredrivehub.com',
      company_phone: '+91 8897072640',
      company_address: 'Hyderabad, Telangana, India',
      business_hours: '9:00 AM - 9:00 PM',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
    payment: {
      razorpay_key_id: '',
      razorpay_key_secret: '',
      payment_processing_fee: 2.5,
      auto_refund_enabled: true,
      payment_timeout: 15,
    },
    notification: {
      email_notifications: true,
      sms_notifications: true,
      push_notifications: true,
      booking_confirmations: true,
      payment_alerts: true,
      maintenance_reminders: true,
    },
    booking: {
      advance_booking_days: 30,
      min_booking_hours: 4,
      cancellation_window: 24,
      late_return_penalty: 200,
      fuel_charge_per_km: 8,
      driver_age_minimum: 21,
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('azure_drive_hub_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (category: keyof SystemSettings, updatedSettings: any) => {
    try {
      setIsSaving(true);
      
      const newSettings = {
        ...settings,
        [category]: updatedSettings
      };
      
      // Save to localStorage
      localStorage.setItem('azure_drive_hub_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      toast({
        title: "Settings Saved",
        description: `${category} settings have been updated successfully.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/admin')}
          className="hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Booking
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={settings.general.company_name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        company_name: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={settings.general.company_email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        company_email: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company_phone">Company Phone</Label>
                  <Input
                    id="company_phone"
                    value={settings.general.company_phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        company_phone: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="business_hours">Business Hours</Label>
                  <Input
                    id="business_hours"
                    value={settings.general.business_hours}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        business_hours: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.general.currency} 
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        currency: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      general: {
                        ...prev.general,
                        timezone: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  value={settings.general.company_address}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: {
                      ...prev.general,
                      company_address: e.target.value
                    }
                  }))}
                  rows={3}
                />
              </div>
              <Button onClick={() => saveSettings('general', settings.general)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save General Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Gateway Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razorpay_key_id">Razorpay Key ID</Label>
                  <Input
                    id="razorpay_key_id"
                    value={settings.payment.razorpay_key_id}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payment: {
                        ...prev.payment,
                        razorpay_key_id: e.target.value
                      }
                    }))}
                    placeholder="rzp_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor="razorpay_key_secret">Razorpay Key Secret</Label>
                  <Input
                    id="razorpay_key_secret"
                    type="password"
                    value={settings.payment.razorpay_key_secret}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payment: {
                        ...prev.payment,
                        razorpay_key_secret: e.target.value
                      }
                    }))}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_processing_fee">Processing Fee (%)</Label>
                  <Input
                    id="payment_processing_fee"
                    type="number"
                    step="0.1"
                    value={settings.payment.payment_processing_fee}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payment: {
                        ...prev.payment,
                        payment_processing_fee: parseFloat(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_timeout">Payment Timeout (minutes)</Label>
                  <Input
                    id="payment_timeout"
                    type="number"
                    value={settings.payment.payment_timeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payment: {
                        ...prev.payment,
                        payment_timeout: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_refund"
                  checked={settings.payment.auto_refund_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    payment: {
                      ...prev.payment,
                      auto_refund_enabled: checked
                    }
                  }))}
                />
                <Label htmlFor="auto_refund">Enable Automatic Refunds</Label>
              </div>
              <Button onClick={() => saveSettings('payment', settings.payment)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.notification.email_notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        email_notifications: checked
                      }
                    }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms_notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={settings.notification.sms_notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        sms_notifications: checked
                      }
                    }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="booking_confirmations">Booking Confirmations</Label>
                    <p className="text-sm text-muted-foreground">Send booking confirmation messages</p>
                  </div>
                  <Switch
                    id="booking_confirmations"
                    checked={settings.notification.booking_confirmations}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        booking_confirmations: checked
                      }
                    }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment_alerts">Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send payment-related notifications</p>
                  </div>
                  <Switch
                    id="payment_alerts"
                    checked={settings.notification.payment_alerts}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        payment_alerts: checked
                      }
                    }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance_reminders">Maintenance Reminders</Label>
                    <p className="text-sm text-muted-foreground">Send vehicle maintenance alerts</p>
                  </div>
                  <Switch
                    id="maintenance_reminders"
                    checked={settings.notification.maintenance_reminders}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notification: {
                        ...prev.notification,
                        maintenance_reminders: checked
                      }
                    }))}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings('notification', settings.notification)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance_booking_days">Advance Booking (Days)</Label>
                  <Input
                    id="advance_booking_days"
                    type="number"
                    value={settings.booking.advance_booking_days}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        advance_booking_days: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="min_booking_hours">Minimum Booking (Hours)</Label>
                  <Input
                    id="min_booking_hours"
                    type="number"
                    value={settings.booking.min_booking_hours}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        min_booking_hours: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cancellation_window">Cancellation Window (Hours)</Label>
                  <Input
                    id="cancellation_window"
                    type="number"
                    value={settings.booking.cancellation_window}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        cancellation_window: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="late_return_penalty">Late Return Penalty (₹)</Label>
                  <Input
                    id="late_return_penalty"
                    type="number"
                    value={settings.booking.late_return_penalty}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        late_return_penalty: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel_charge_per_km">Fuel Charge (₹/km)</Label>
                  <Input
                    id="fuel_charge_per_km"
                    type="number"
                    value={settings.booking.fuel_charge_per_km}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        fuel_charge_per_km: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="driver_age_minimum">Minimum Driver Age</Label>
                  <Input
                    id="driver_age_minimum"
                    type="number"
                    value={settings.booking.driver_age_minimum}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      booking: {
                        ...prev.booking,
                        driver_age_minimum: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings('booking', settings.booking)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Booking Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Payment Gateway</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">98% Available</p>
              </div>
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;