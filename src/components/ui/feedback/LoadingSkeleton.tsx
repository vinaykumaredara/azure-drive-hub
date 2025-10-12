import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for booking flow steps
 * Provides visual feedback while content is loading
 */
export const BookingStepSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6" role="status" aria-label="Loading booking step">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
};

/**
 * Loading skeleton for car card
 */
export const CarCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3" role="status" aria-label="Loading car">
      <Skeleton className="w-full h-48 rounded-md" />
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
};
