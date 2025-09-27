import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

const TestSupabaseConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test read operation
        const { data, error } = await supabase
          .from('cars')
          .select('id, title, make, model')
          .limit(1);

        if (error) {
          setError(`Connection error: ${error.message}`);
          setConnectionStatus('Failed');
        } else {
          setData(data);
          setConnectionStatus('Connected');
        }
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`);
        setConnectionStatus('Failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-2">Supabase Connection Test</h2>
      <p>Status: <span className={connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>{connectionStatus}</span></p>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
          <strong>Success!</strong> Connected to Supabase and retrieved data:
          <pre className="mt-2 text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Project URL:</strong> https://rcpkhtlvfvafympulywx.supabase.co</p>
        <p><strong>Database Host:</strong> db.rcpkhtlvfvafympulywx.supabase.co</p>
        <p><strong>Database Port:</strong> 5432</p>
        <p><strong>Database Name:</strong> postgres</p>
        <p><strong>Database User:</strong> postgres</p>
      </div>
    </div>
  );
};

export default TestSupabaseConnection;