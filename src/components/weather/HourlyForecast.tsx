"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type HourlyData = {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  pop: number; // Probability of precipitation
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind_speed: number;
  wind_deg: number;
};

type HourlyForecastProps = {
  lat: number;
  lon: number;
  cityName: string;
};

export default function HourlyForecast({ lat, lon, cityName }: HourlyForecastProps) {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch hourly forecast');
        }
        
        setHourlyData(data.hourly || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHourlyData();
  }, [lat, lon]);

  const iconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

  const formatHour = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday && Math.abs(date.getTime() - now.getTime()) < 3600000) {
      return 'Now';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="text-sm text-muted-foreground">Loading hourly forecast...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500 text-sm">Error loading hourly forecast: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">24-Hour Forecast - {cityName}</h3>
        
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {hourlyData.map((hour, index) => (
              <div
                key={hour.dt}
                className={`flex-shrink-0 w-20 text-center p-3 rounded-lg border ${
                  index === 0 ? 'bg-primary/10 border-primary/20' : 'bg-background/60'
                }`}
              >
                <div className="text-xs font-medium mb-2">
                  {formatHour(hour.dt)}
                </div>
                
                {/* Weather Icon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconUrl(hour.weather[0].icon)}
                  alt={hour.weather[0].description}
                  className="w-10 h-10 mx-auto mb-2"
                />
                
                {/* Temperature */}
                <div className="text-sm font-bold mb-1">
                  {Math.round(hour.temp)}°
                </div>
                
                {/* Feels like */}
                <div className="text-xs text-muted-foreground mb-2">
                  {Math.round(hour.feels_like)}°
                </div>
                
                {/* Rain probability */}
                {hour.pop > 0 && (
                  <div className="text-xs text-blue-500 mb-1">
                    🌧️ {Math.round(hour.pop * 100)}%
                  </div>
                )}
                
                {/* Wind */}
                <div className="text-xs text-muted-foreground mb-1">
                  💨 {Math.round(hour.wind_speed * 3.6)} km/h
                </div>
                
                {/* Wind direction */}
                <div className="text-xs text-muted-foreground">
                  {getWindDirection(hour.wind_deg)}
                </div>
                
                {/* Humidity */}
                <div className="text-xs text-muted-foreground mt-1">
                  💧 {hour.humidity}%
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}