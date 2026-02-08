import { SkeletonCard } from '@/components/ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-64 rounded-full" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  );
}
