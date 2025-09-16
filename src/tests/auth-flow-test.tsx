import React from 'react';
import { supabase } from '@/integrations/supabase/client';

// Test component to verify auth flow
const AuthFlowTest: React.FC = () => {
  const [testResult, setTestResult] = React.useState<string>('');
  
  const testAdminUser = async () => {
    try {
      setTestResult('Testing admin user...');
      
      // Try to sign in as admin
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'rpcars2025@gmail.com',
        password: 'your-admin-password-here', // Replace with actual password
      });
      
      if (error) {
        setTestResult(`Sign in error: ${error.message}`);
        return;
      }
      
      if (data.user) {
        setTestResult(`Signed in as: ${data.user.email}`);
        
        // Check admin status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();
          
        if (userError) {
          setTestResult(`User check error: ${userError.message}`);
          return;
        }
        
        setTestResult(`User is admin: ${userData?.is_admin || false}`);
      }
    } catch (error) {
      setTestResult(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Auth Flow Test</h2>
      <button 
        onClick={testAdminUser}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Admin Login
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Result: {testResult}</p>
      </div>
    </div>
  );
};

export default AuthFlowTest;