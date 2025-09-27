import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TestSupabaseConnection from '@/components/TestSupabaseConnection';

const TestPage: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  
  const handleSignOut = async () => {
    console.log('Attempting to sign out...');
    try {
      await signOut();
      console.log('Sign out completed');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  const handleAdminCheck = async () => {
    console.log('Current user:', user);
    console.log('Is admin:', isAdmin);
    
    if (user) {
      // Manually check admin status
      const response = await fetch('/api/admin-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const result = await response.json();
      console.log('Manual admin check result:', result);
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RP CARS Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">User Status</h3>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Email: {user?.email || 'Not logged in'}</p>
            <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleSignOut}>
              Test Sign Out
            </Button>
            <Button onClick={handleAdminCheck} variant="outline">
              Check Admin Status
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Supabase Connection Test */}
      <TestSupabaseConnection />
    </div>
  );
};

export default TestPage;