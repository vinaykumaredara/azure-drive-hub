import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Car card skeleton for loading states
const CarCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// Car list skeleton for loading multiple cars
const CarListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <CarCardSkeleton key={i} />
    ))}
  </div>
);

export { Skeleton, CarCardSkeleton, CarListSkeleton }
