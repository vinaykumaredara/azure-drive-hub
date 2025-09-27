// src/pages/ImageAlignmentDebugPage.tsx
// Debug page to show file/DB alignment for every car

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { verifyCarImageAlignment } from '@/utils/imageCrudUtils';

const ImageAlignmentDebugPage: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyAllCars = async () => {
    setVerifying(true);
    try {
      const results: Record<string, any> = {};
      
      for (const car of cars) {
        const result = await verifyCarImageAlignment(car.id);
        results[car.id] = result;
      }
      
      setVerificationResults(results);
    } catch (error) {
      console.error('Error verifying cars:', error);
    } finally {
      setVerifying(false);
    }
  };

  const verifySingleCar = async (carId: string) => {
    setSelectedCarId(carId);
    try {
      const result = await verifyCarImageAlignment(carId);
      setVerificationResults(prev => ({
        ...prev,
        [carId]: result
      }));
    } catch (error) {
      console.error('Error verifying car:', error);
    } finally {
      setSelectedCarId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Image Alignment Debug</h1>
        <p className="text-muted-foreground">Verify storage and database alignment for all car images</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={verifyAllCars} disabled={verifying}>
          {verifying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Verify All Cars
            </>
          )}
        </Button>
        <Button variant="outline" onClick={fetchCars}>
          Refresh Cars
        </Button>
      </div>

      {cars.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No cars found</AlertTitle>
          <AlertDescription>
            There are no cars in the database to verify.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
            const verification = verificationResults[car.id];
            
            return (
              <Card key={car.id} className="overflow-hidden">
                <CardHeader className="p-4 bg-muted">
                  <CardTitle className="text-lg flex justify-between items-start">
                    <span className="truncate">{car.title}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verifySingleCar(car.id)}
                      disabled={selectedCarId === car.id}
                    >
                      {selectedCarId === car.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Images:</h3>
                    {car.image_urls && car.image_urls.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {car.image_urls.slice(0, 4).map((url: string, index: number) => (
                          <div key={index} className="relative">
                            <LazyImage
                              src={url}
                              alt={`Car image ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                          </div>
                        ))}
                        {car.image_urls.length > 4 && (
                          <div className="flex items-center justify-center bg-muted rounded">
                            <span className="text-xs">+{car.image_urls.length - 4} more</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No images</p>
                    )}
                  </div>

                  {verification ? (
                    <div className="mt-4">
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Verification:</h3>
                      {verification.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{verification.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {verification.allAccessible ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {verification.allAccessible ? 'All images accessible' : 'Some images inaccessible'}
                            </span>
                          </div>
                          
                          <div className="text-xs space-y-1">
                            {verification.verificationResults.map((result: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                {result.status === 'accessible' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : result.status === 'fallback' ? (
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span className="truncate">
                                  {result.url.substring(0, 30)}{result.url.length > 30 ? '...' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Click verify to check alignment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageAlignmentDebugPage;