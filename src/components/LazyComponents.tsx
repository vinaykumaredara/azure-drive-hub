import { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading wrapper with enhanced error boundary
const LazyComponentWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const defaultFallback = (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// Optimized lazy loading for admin components
export const LazyAdminCarManagement = lazy(() => 
  import('@/components/AdminCarManagement').then(module => ({
    default: module.default
  }))
);

export const LazyAdminBookingManagement = lazy(() => 
  import('@/components/AdminBookingManagement').then(module => ({
    default: module.default
  }))
);

export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/AnalyticsDashboard').then(module => ({
    default: module.AnalyticsDashboard
  }))
);

export const LazyPromoCodeManager = lazy(() => 
  import('@/components/PromoCodeManager').then(module => ({
    default: module.PromoCodeManager
  }))
);

export const LazyMaintenanceScheduler = lazy(() => 
  import('@/components/MaintenanceScheduler').then(module => ({
    default: module.MaintenanceScheduler
  }))
);

export const LazySystemSettings = lazy(() => 
  import('@/components/SystemSettings').then(module => ({
    default: module.default
  }))
);

export const LazySecurityCompliance = lazy(() => 
  import('@/components/SecurityCompliance').then(module => ({
    default: module.default
  }))
);

// Additional lazy loading components for user features
export const LazyPaymentGateway = lazy(() => 
  import('@/components/PaymentGateway').then(module => ({
    default: module.PaymentGateway
  }))
);

export const LazyPromoCodeInput = lazy(() => 
  import('@/components/PromoCodeInput').then(module => ({
    default: module.PromoCodeInput
  }))
);

export const LazyCarImageGallery = lazy(() => 
  import('@/components/CarImageGallery').then(module => ({
    default: module.CarImageGallery
  }))
);

export const LazyLicenseUpload = lazy(() => 
  import('@/components/LicenseUpload').then(module => ({
    default: module.LicenseUpload
  }))
);

export const LazyChatWidget = lazy(() => 
  import('@/components/ChatWidget').then(module => ({
    default: module.ChatWidget
  }))
);

export { LazyComponentWrapper };