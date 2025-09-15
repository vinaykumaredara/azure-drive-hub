import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, ArrowLeft, Key, Eye, AlertTriangle, CheckCircle, 
  Activity, Lock, FileText, Download, RefreshCw, Filter,
  Search, Calendar, User, Clock, Globe, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SecurityCompliance: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: true,
    password_policy_enabled: true,
    session_timeout: 30,
    max_login_attempts: 5,
    lockout_duration: 15,
    require_password_change: false,
    audit_logging: true,
    data_retention_days: 90
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Use mock data for demonstration
      const mockAuditLogs = [
        {
          id: '1',
          created_at: new Date().toISOString(),
          action: 'user_login',
          resource: 'auth',
          user_email: 'admin@azuredrivehub.com',
          ip_address: '192.168.1.1',
          details: { success: true }
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          action: 'car_booking',
          resource: 'bookings',
          user_email: 'customer@azuredrivehub.com',
          ip_address: '192.168.1.2',
          details: { car_id: 'abc123', amount: 1500 }
        }
      ];
      
      const mockSecurityAlerts = [
        {
          id: '1',
          type: 'info',
          severity: 'low',
          message: 'System security scan completed successfully',
          created_at: new Date().toISOString(),
          resolved: false
        }
      ];
      
      setAuditLogs(mockAuditLogs);
      setSecurityAlerts(mockSecurityAlerts);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSecuritySetting = async (key: string, value: any) => {
    try {
      setSecuritySettings(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Setting Updated",
        description: "Security setting has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setSecurityAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true }
            : alert
        )
      );
      
      toast({
        title: "Alert Resolved",
        description: "Security alert has been marked as resolved.",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const csv = [
        'Date,User,Action,Resource,IP Address',
        ...auditLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user_email || 'System',
          log.action,
          log.resource,
          log.ip_address
        ].join(','))
      ].join('\\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({
        title: "Export Successful",
        description: "Audit logs have been exported to CSV.",
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold">Security & Compliance</h2>
          <p className="text-muted-foreground">
            Monitor security status and manage compliance settings
          </p>
        </div>
      </div>

      {/* Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Alerts
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Security Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Security Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-muted-foreground">Overall Security Score</div>
                </div>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">Authentication</div>
                  <div className="text-sm text-muted-foreground">Excellent</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">Data Protection</div>
                  <div className="text-sm text-muted-foreground">Good</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-yellow-600">Access Control</div>
                  <div className="text-sm text-muted-foreground">Needs Review</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">Monitoring</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">1,247</p>
                    <p className="text-xs text-green-600">+12 this week</p>
                  </div>
                  <User className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-xs text-blue-600">Current active</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Security Alerts</p>
                    <p className="text-2xl font-bold">{securityAlerts.filter(a => !a.resolved).length}</p>
                    <p className="text-xs text-orange-600">Unresolved</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={exportAuditLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={fetchSecurityData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Audit Log Entries */}
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm text-muted-foreground">{log.resource}</span>
                          </div>
                          <p className="text-sm font-medium">{log.user_email}</p>
                          <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">All Clear!</h3>
                    <p className="text-muted-foreground">No security alerts at this time.</p>
                  </div>
                ) : (
                  securityAlerts.map((alert) => (
                    <Alert key={alert.id} className={alert.resolved ? 'opacity-50' : ''}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {getAlertIcon(alert.severity)}
                          <div>
                            <h4 className="font-medium">{alert.message}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two_factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch
                      id="two_factor"
                      checked={securitySettings.two_factor_enabled}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }));
                        updateSecuritySetting('two_factor_enabled', checked);
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="password_policy">Strong Password Policy</Label>
                      <p className="text-sm text-muted-foreground">Enforce complex password requirements</p>
                    </div>
                    <Switch
                      id="password_policy"
                      checked={securitySettings.password_policy_enabled}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, password_policy_enabled: checked }));
                        updateSecuritySetting('password_policy_enabled', checked);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Session Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Session Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={securitySettings.session_timeout}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSecuritySettings(prev => ({ ...prev, session_timeout: value }));
                        updateSecuritySetting('session_timeout', value);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSecuritySettings(prev => ({ ...prev, max_login_attempts: value }));
                        updateSecuritySetting('max_login_attempts', value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Account Lockout */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockout_duration"
                      type="number"
                      value={securitySettings.lockout_duration}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSecuritySettings(prev => ({ ...prev, lockout_duration: value }));
                        updateSecuritySetting('lockout_duration', value);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_retention">Data Retention (days)</Label>
                    <Input
                      id="data_retention"
                      type="number"
                      value={securitySettings.data_retention_days}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSecuritySettings(prev => ({ ...prev, data_retention_days: value }));
                        updateSecuritySetting('data_retention_days', value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit_logging">Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all user actions and system events</p>
                    </div>
                    <Switch
                      id="audit_logging"
                      checked={securitySettings.audit_logging}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, audit_logging: checked }));
                        updateSecuritySetting('audit_logging', checked);
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">GDPR Compliance</p>
                <p className="text-sm text-muted-foreground">Data Protection</p>
              </div>
              <Badge className="bg-green-500">Compliant</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">ISO 27001</p>
                <p className="text-sm text-muted-foreground">Security Management</p>
              </div>
              <Badge className="bg-green-500">Certified</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">SOC 2</p>
                <p className="text-sm text-muted-foreground">Security Controls</p>
              </div>
              <Badge className="bg-green-500">Verified</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityCompliance;