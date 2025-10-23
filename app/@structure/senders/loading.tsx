'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SendersLoading() {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <Skeleton className="h-10 w-10" />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Senders</CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-24" />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}