import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  // Safe settings that can be edited
  const editableSettings: SystemSetting[] = [
    {
      key: 'site_name',
      value: 'RP Cars',
      description: 'The name of the website',
      type: 'string'
    },
    {
      key: 'site_description',
      value: 'Premium car rental service in India',
      description: 'Site description for SEO',
      type: 'string'
    },
    {
      key: 'contact_email',
      value: 'support@rpcars.in',
      description: 'Primary contact email',
      type: 'string'
    },
    {
      key: 'contact_phone',
      value: '+91 9876543210',
      description: 'Primary contact phone number',
      type: 'string'
    },
    {
      key: 'maintenance_mode',
      value: false,
      description: 'Enable maintenance mode',
      type: 'boolean'
    },
    {
      key: 'max_booking_days',
      value: 30,
      description: 'Maximum days a car can be booked',
      type: 'number'
    },
    {
      key: 'default_service_charge',
      value: 500,
      description: 'Default service charge in INR paise',
      type: 'number'
    }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Initialize with default values
      const initialSettings: Record<string, any> = {};
      editableSettings.forEach(setting => {
        initialSettings[setting.key] = setting.value;
      });
      
      // Fetch actual settings from database
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
        
      if (error) {
        console.warn('No system settings found, using defaults:', error);
        // Continue with default values if no settings exist
      } else {
        // Override defaults with actual values
        data?.forEach(row => {
          try {
            initialSettings[row.key] = JSON.parse(row.value);
          } catch {
            initialSettings[row.key] = row.value;
          }
        });
      }
      
      setSettings(initialSettings);
      setLocalSettings(initialSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // Save each setting to database
      for (const key of Object.keys(localSettings)) {
        const setting = editableSettings.find(s => s.key === key);
        let value = localSettings[key];
        
        // Convert to appropriate type
        if (setting?.type === 'number') {
          value = Number(value);
        } else if (setting?.type === 'boolean') {
          value = Boolean(value);
        }
        
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });
          
        if (error) {throw error;}
      }
      
      // Update local state
      setSettings(localSettings);
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });
      
      // Log audit entry
      try {
        await logAuditAction('settings_update', 'System settings updated');
      } catch (auditError) {
        console.warn('Failed to log audit action:', auditError);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const logAuditAction = async (action: string, description: string, metadata?: any) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      
      // Insert audit log entry
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          description,
          user_id: user?.id,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
      
      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
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
            Configure global system settings
          </p>
        </div>
      </div>
      
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {editableSettings.map((setting) => (
            <motion.div
              key={setting.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1">
                <Label className="font-medium">{setting.key}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {setting.description}
                </p>
              </div>
              
              <div className="w-full md:w-64">
                {setting.type === 'boolean' ? (
                  <Switch
                    checked={localSettings[setting.key] ?? setting.value}
                    onCheckedChange={(checked) => handleInputChange(setting.key, checked)}
                  />
                ) : setting.type === 'number' ? (
                  <Input
                    type="number"
                    value={localSettings[setting.key] ?? setting.value}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={localSettings[setting.key] ?? setting.value}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  />
                )}
              </div>
            </motion.div>
          ))}
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            About System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            These settings control the global behavior of the RP Cars system. 
            Changes take effect immediately across the entire application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;