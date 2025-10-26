'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLoading() {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="space-y-4">
        {/* Header Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Loading audit logs...</CardDescription>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>

        {/* Table Card Skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
