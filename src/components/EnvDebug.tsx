import React, { useEffect, useState } from 'react';

export const EnvDebug: React.FC = () => {
  const [envInfo, setEnvInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    // Log environment information to console
    const info = {
      'import.meta.env.MODE': import.meta.env.MODE,
      'import.meta.env.PROD': import.meta.env.PROD,
      'import.meta.env.DEV': import.meta.env.DEV,
      'import.meta.env.VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
      'import.meta.env.VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      'import.meta.env.VITE_RAZORPAY_KEY_ID': import.meta.env.VITE_RAZORPAY_KEY_ID ? 'SET' : 'MISSING',
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
      'process.env.NODE_ENV': process.env.NODE_ENV,
    };
    
    console.log('🔍 Environment Debug Information:', info);
    setEnvInfo(info);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
      <h2>Environment Debug Information</h2>
      <pre>{JSON.stringify(envInfo, null, 2)}</pre>
    </div>
  );
};