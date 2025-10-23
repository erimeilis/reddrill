'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function RootLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}