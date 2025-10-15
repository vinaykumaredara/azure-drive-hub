import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export function PhoneModal({ 
  onClose, 
  onComplete, 
  isFirstTimeSetup = false 
}: { 
  onClose: () => void; 
  onComplete?: (profile: any) => void;
  isFirstTimeSetup?: boolean;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update phone state when profile changes
  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone);
    }
  }, [profile?.phone]);

  const validatePhone = (phone: string) => {
    // Basic phone number validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = phone.replace(/\D/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  const handleSave = async () => {
    if (!user) {
      console.error('No user found in handleSave');
      return;
    }
    
    // Validate phone number
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    
    console.log('Saving phone number for user:', user.id, 'isFirstTimeSetup:', isFirstTimeSetup);
    
    setLoading(true);
    setError('');
    
    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const updates: any = { id: user.id, phone: cleanedPhone };
      const { data, error } = await supabase.from('users').upsert(updates, { onConflict: 'id' }).select().single();
      
      if (error) {
        console.error('Phone update error:', error);
        throw error;
      }
      
      // Add debug logging
      console.log('Phone number saved successfully:', data);
      
      // Set flag to trigger profile refresh in AuthProvider
      sessionStorage.setItem('profileJustUpdated', '1');
      
      // Clear the new user flags if this is first-time setup
      if (isFirstTimeSetup) {
        console.log('Clearing new user flags after phone setup');
        sessionStorage.removeItem('isNewGoogleUser');
        sessionStorage.removeItem('needsPhoneCollection');
        
        toast({
          title: "Welcome to RP Cars! 🎉",
          description: "Your account is all set up. Let's find you a perfect car!",
        });
      } else {
        toast({
          title: "Phone Number Saved",
          description: "Your phone number has been successfully saved.",
        });
      }
      
      // Refresh profile after successful save
      if (refreshProfile) {
        console.log('Triggering profile refresh...');
        await refreshProfile();
      }
      
      if (onComplete) {
        console.log('Calling onComplete callback');
        onComplete(data);
      }
      
      console.log('Phone save complete, closing modal');
      onClose();
    } catch (err: any) {
      console.error('save phone err', err);
      setError('Could not save phone number. Try again.');
      toast({
        title: "Error",
        description: err?.message || "Could not save phone number. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && phone) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {isFirstTimeSetup ? "Complete Your Profile" : "Add Phone Number"}
          </CardTitle>
          {isFirstTimeSetup && (
            <p className="text-sm text-muted-foreground mt-2">
              Welcome! We need your phone number to confirm bookings and send you important updates.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="+91 1234567890" 
                className="w-full"
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {isFirstTimeSetup 
                  ? "This is required to complete your registration." 
                  : "We need your phone number to confirm your booking and send important updates."}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              {!isFirstTimeSetup && (
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave} disabled={loading || !phone || phone.length < 10}>
                {loading ? 'Saving...' : isFirstTimeSetup ? 'Complete Setup' : 'Save & Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}