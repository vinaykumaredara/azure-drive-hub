// DebugCarData.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import useCars from '@/hooks/useCars';

const DebugCarData = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { cars: hookCars, refetch } = useCars();

  const runDebug = async () => {
    setLoading(true);
    try {
      // 1. Check what's in the database
      const { data: dbCars, error: dbError } = await supabase
        .from('cars')
        .select('*');

      // 2. Check storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('cars-photos')
        .list('', { limit: 10 });

      setDebugData({
        databaseCars: dbCars,
        databaseError: dbError,
        hookCars: hookCars,
        storageFiles: storageFiles,
        storageError: storageError
      });

      console.log('DEBUG DATA:', {
        databaseCars: dbCars,
        databaseError: dbError,
        hookCars: hookCars,
        storageFiles: storageFiles,
        storageError: storageError
      });
    } catch (error) {
      console.error('Debug failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run debug on component mount
  useEffect(() => {
    runDebug();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid red', margin: '20px 0' }}>
      <h3>DEBUG CAR DATA</h3>
      <button onClick={runDebug} disabled={loading}>
        {loading ? 'Running Debug...' : 'Run Debug Check'}
      </button>
      <button onClick={refetch} style={{ marginLeft: '10px' }}>
        Refresh Data
      </button>
      {debugData && (
        <div>
          <h4>Database Cars ({debugData.databaseCars?.length || 0}):</h4>
          <pre>{JSON.stringify(debugData.databaseCars, null, 2)}</pre>
          
          <h4>Hook Cars ({debugData.hookCars?.length || 0}):</h4>
          <pre>{JSON.stringify(debugData.hookCars, null, 2)}</pre>
          
          <h4>Storage Files ({debugData.storageFiles?.length || 0}):</h4>
          <pre>{JSON.stringify(debugData.storageFiles, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugCarData;