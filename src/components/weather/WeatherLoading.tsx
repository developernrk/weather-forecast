"use client";

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WeatherCardSkeleton() {
  return (
    <Card className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* Current Weather */}
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          
          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1 p-2 border rounded-lg">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Details Button */}
      <Skeleton className="h-8 w-full" />
    </Card>
  );
}

export function WeatherGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <WeatherCardSkeleton key={i} />
      ))}
    </div>
  );
}