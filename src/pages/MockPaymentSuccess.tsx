import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const MockPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order ID from URL params
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId') || 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your booking has been confirmed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Order ID: {orderId}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Check your dashboard for booking details</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Contact support if you have any questions</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-primary to-primary-dark"
            >
              View Booking Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Browse More Cars
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};