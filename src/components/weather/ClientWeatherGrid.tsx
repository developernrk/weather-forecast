"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import WeatherCard from './WeatherCard';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WeatherData = {
  city: {
    id: string;
    name: string;
    country?: string;
  };
  current: any;
  forecast: any;
};

export function ClientWeatherGrid({ initialWeatherData }: { initialWeatherData: WeatherData[] }) {
  const [weatherData, setWeatherData] = useState(initialWeatherData);
  const [removingCityId, setRemovingCityId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync local state when server-provided data changes (e.g., after router.refresh())
  useEffect(() => {
    setWeatherData(initialWeatherData);
  }, [initialWeatherData]);

  const handleRemoveClick = (cityId: string) => {
    setRemovingCityId(cityId);
    setIsDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!removingCityId) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/cities?cityId=${removingCityId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the city from local state
          setWeatherData(prev => prev.filter(item => item.city.id !== removingCityId));
          // Also refresh the page to ensure server state is in sync
          router.refresh();
        } else {
          console.error('Failed to remove city');
        }
      } catch (error) {
        console.error('Error removing city:', error);
      } finally {
        setIsDialogOpen(false);
        setRemovingCityId(null);
      }
    });
  };

  const handleCancelRemove = () => {
    setIsDialogOpen(false);
    setRemovingCityId(null);
  };

  if (weatherData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground animate-in fade-in-50">
          <div className="text-4xl mb-4">🌤️</div>
          <p className="text-lg mb-2">No cities added yet</p>
          <p className="text-sm">Use the search above to add your first city and start tracking weather!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {weatherData.map(({ city, current, forecast }, idx) => (
          <div
            key={city.id}
            className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <WeatherCard
              title={`${city.name}${city.country ? ', ' + city.country : ''}`}
              current={current}
              forecast={forecast}
              cityId={city.id}
              onRemove={handleRemoveClick}
              city={city}
            />
          </div>
        ))}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this city from your weather dashboard? 
              You can add it back anytime by searching for it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRemove} disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemove}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}