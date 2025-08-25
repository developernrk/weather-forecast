"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WeatherDetailsProps = {
  city: {
    id: string;
    name: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  current: any;
  forecast: any;
};

export default function WeatherDetails({ city, current, forecast }: WeatherDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [airQuality, setAirQuality] = useState<any>(null);

  // Simulate Air Quality data (in real app, fetch from additional API endpoint)
  useEffect(() => {
    if (isOpen && city.lat && city.lon) {
      // Mock AQI data - in production, you'd fetch from OpenWeather Air Pollution API
      const mockAQI = Math.floor(Math.random() * 5) + 1;
      setAirQuality({
        main: { aqi: mockAQI },
        components: {
          co: Math.random() * 1000,
          no2: Math.random() * 100,
          o3: Math.random() * 200,
          pm2_5: Math.random() * 50,
          pm10: Math.random() * 100,
        }
      });
    }
  }, [isOpen, city.lat, city.lon]);

  const iconUrl = (icon?: string) => (icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : undefined);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '--';
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWindDirection = (deg?: number) => {
    if (deg === undefined) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const getAirQualityInfo = (aqi: number) => {
    const levels = [
      { level: 'Good', color: 'bg-green-500', textColor: 'text-green-700', desc: 'Air quality is excellent' },
      { level: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700', desc: 'Air quality is acceptable' },
      { level: 'Moderate', color: 'bg-orange-500', textColor: 'text-orange-700', desc: 'Sensitive people may experience minor issues' },
      { level: 'Poor', color: 'bg-red-500', textColor: 'text-red-700', desc: 'Everyone may experience health effects' },
      { level: 'Very Poor', color: 'bg-purple-500', textColor: 'text-purple-700', desc: 'Health warnings of emergency conditions' },
    ];
    return levels[aqi - 1] || levels[0];
  };

  const getUVLevel = (temp: number) => {
    // Mock UV calculation based on temperature and time of day
    const hour = new Date().getHours();
    let uv = 0;

    if (hour >= 6 && hour <= 18) {
      uv = Math.max(0, Math.min(11, Math.floor((temp + 10) / 5)));
    }

    if (uv <= 2) return { level: 'Low', color: 'bg-green-500', value: uv, advice: 'Minimal sun protection needed' };
    if (uv <= 5) return { level: 'Moderate', color: 'bg-yellow-500', value: uv, advice: 'Some protection recommended' };
    if (uv <= 7) return { level: 'High', color: 'bg-orange-500', value: uv, advice: 'Protection essential' };
    if (uv <= 10) return { level: 'Very High', color: 'bg-red-500', value: uv, advice: 'Extra protection required' };
    return { level: 'Extreme', color: 'bg-purple-500', value: uv, advice: 'Avoid outdoor activities' };
  };

  const getComfortLevel = (temp: number, humidity: number) => {
    if (temp < 0) return { level: 'Very Cold', color: 'text-blue-600', icon: '🥶', advice: 'Dress warmly, limit outdoor time' };
    if (temp < 10) return { level: 'Cold', color: 'text-blue-500', icon: '🧊', advice: 'Wear layers and warm clothing' };
    if (temp < 20) return { level: 'Cool', color: 'text-blue-400', icon: '😌', advice: 'Light jacket recommended' };
    if (temp > 35 || (temp > 25 && humidity > 70)) return { level: 'Hot', color: 'text-red-500', icon: '🥵', advice: 'Stay hydrated, seek shade' };
    if (temp > 30) return { level: 'Warm', color: 'text-orange-500', icon: '☀️', advice: 'Light clothing, stay hydrated' };
    return { level: 'Comfortable', color: 'text-green-500', icon: '😊', advice: 'Perfect weather conditions' };
  };

  // Get hourly forecast for next 24 hours
  const hourlyForecast = forecast?.list?.slice(0, 8) || [];

  // Extended forecast data for the next 7 days
  const weeklyForecast = forecast?.list?.filter((item: any, index: number) => index % 8 === 0).slice(0, 7) || [];

  const uvIndex = current?.main?.temp ? getUVLevel(current.main.temp) : null;
  const comfort = current?.main ? getComfortLevel(current.main.temp, current.main.humidity) : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2 bg-white/40 dark:bg-white/5 backdrop-blur-md border-0 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white/60 dark:hover:bg-white/10 shadow-sm transition">
          <span className="mr-2">🔍</span>
          Detailed Forecast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-none w-[70vw] h-[92vh] max-h-none overflow-hidden rounded-2xl border-0 ring-1 ring-black/5 dark:ring-white/10 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950 border-b border-black/5 dark:border-white/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span>🌤️</span>
            Weather Details - {city.name}{city.country ? `, ${city.country}` : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-background/60 backdrop-blur-md border-b border-black/5 dark:border-white/10">
            <TabsTrigger value="current">Overview</TabsTrigger>
            <TabsTrigger value="health">Health & Comfort</TabsTrigger>
            <TabsTrigger value="hourly">24-Hour</TabsTrigger>
            <TabsTrigger value="weekly">7-Day</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[80vh] overflow-y-auto bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Current Weather Overview */}
            <TabsContent value="current" className="space-y-10 px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8">
                {/* Main Weather Display */}
                <Card className="p-6 col-span-full md:col-span-1 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    {current?.weather?.[0]?.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconUrl(current.weather[0].icon)} alt="weather" className="w-20 h-20" />
                    )}
                    <div>
                      <div className="text-4xl font-bold">
                        {Math.round(current?.main?.temp || 0)}°C
                      </div>
                      <div className="text-lg text-muted-foreground capitalize">
                        {current?.weather?.[0]?.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Feels like {Math.round(current?.main?.feels_like || 0)}°C
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>High / Low:</span>
                      <span className="font-semibold">{Math.round(current?.main?.temp_max || 0)}° / {Math.round(current?.main?.temp_min || 0)}°</span>
                    </div>
                  </div>
                </Card>

                {/* Atmospheric Conditions */}
                <Card className="p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    🌫️ Atmospheric
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Humidity</span>
                      <div className="flex items-center gap-2">
                        <Progress value={current?.main?.humidity || 0} className="w-16 h-2" />
                        <span className="font-semibold text-sm">{current?.main?.humidity || '--'}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pressure:</span>
                      <span className="font-semibold text-sm">{current?.main?.pressure || '--'} hPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Visibility:</span>
                      <span className="font-semibold text-sm">{current?.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cloud Cover:</span>
                      <span className="font-semibold text-sm">{current?.clouds?.all || '--'}%</span>
                    </div>
                  </div>
                </Card>

                {/* Wind Information */}
                <Card className="p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    💨 Wind
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-semibold">{current?.wind?.speed ? `${Math.round(current.wind.speed * 3.6)} km/h` : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Direction:</span>
                      <span className="font-semibold">{current?.wind?.deg ? `${current.wind.deg}° ${getWindDirection(current.wind.deg)}` : '--'}</span>
                    </div>
                    {current?.wind?.gust && (
                      <div className="flex justify-between">
                        <span>Gusts:</span>
                        <span className="font-semibold">{Math.round(current.wind.gust * 3.6)} km/h</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Sun Information */}
                <Card className="p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    ☀️ Sun & Moon
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sunrise:</span>
                      <span className="font-semibold">{formatTime(current?.sys?.sunrise)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunset:</span>
                      <span className="font-semibold">{formatTime(current?.sys?.sunset)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daylight:</span>
                      <span className="font-semibold">
                        {current?.sys?.sunrise && current?.sys?.sunset
                          ? `${Math.floor((current.sys.sunset - current.sys.sunrise) / 3600)}h ${Math.floor(((current.sys.sunset - current.sys.sunrise) % 3600) / 60)}m`
                          : '--'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Health & Comfort Tab */}
            <TabsContent value="health" className="space-y-8 px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8">
                {/* Comfort Level */}
                {comfort && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      😊 Comfort Level
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{comfort.icon}</span>
                        <div>
                          <div className={`font-bold text-lg ${comfort.color}`}>{comfort.level}</div>
                          <div className="text-sm text-muted-foreground">{comfort.advice}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Based on temperature ({Math.round(current?.main?.temp || 0)}°C) and humidity ({current?.main?.humidity || 0}%)
                      </div>
                    </div>
                  </Card>
                )}

                {/* UV Index */}
                {uvIndex && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      ☀️ UV Index
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`${uvIndex.color} text-white px-3 py-1`}>
                          {uvIndex.value} - {uvIndex.level}
                        </Badge>
                      </div>
                      <Progress value={(uvIndex.value / 11) * 100} className="h-3" />
                      <div className="text-sm text-muted-foreground">{uvIndex.advice}</div>
                    </div>
                  </Card>
                )}

                {/* Air Quality */}
                {airQuality && (
                  <Card className="p-6 col-span-full">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      🌪️ Air Quality Index
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {(() => {
                          const aqInfo = getAirQualityInfo(airQuality.main.aqi);
                          return (
                            <>
                              <Badge className={`${aqInfo.color} text-white px-4 py-2 text-base`}>
                                AQI {airQuality.main.aqi} - {aqInfo.level}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{aqInfo.desc}</span>
                            </>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{airQuality.components.pm2_5.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">PM2.5<br/>μg/m³</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{airQuality.components.pm10.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">PM10<br/>μg/m³</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{airQuality.components.no2.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">NO₂<br/>μg/m³</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{airQuality.components.o3.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">O₃<br/>μg/m³</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{airQuality.components.co.toFixed(0)}</div>
                          <div className="text-xs text-muted-foreground">CO<br/>μg/m³</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* 24-Hour Forecast */}
            <TabsContent value="hourly" className="space-y-6 px-4">
              <Card className="border-none p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  ⏰ Next 24 Hours
                </h3>
                <div className="space-y-3">
                  {hourlyForecast.map((hour: any, index: number) => (
                    <div key={hour.dt} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium w-12 text-sm">
                          {index === 0 ? 'Now' : new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' })}
                        </span>
                        {hour.weather?.[0]?.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={iconUrl(hour.weather[0].icon)}
                            alt="weather"
                            className="w-10 h-10"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium capitalize">{hour.weather?.[0]?.description}</div>
                          <div className="text-xs text-muted-foreground">
                            💧 {hour.main.humidity}% • 🌪️ {Math.round((hour.wind?.speed || 0) * 3.6)} km/h
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hour.pop && hour.pop > 0.1 && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(hour.pop * 100)}%
                          </Badge>
                        )}
                        <span className="font-bold text-lg w-12 text-right">{Math.round(hour.main.temp)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* 7-Day Forecast */}
            <TabsContent value="weekly" className="space-y-6 px-4">
              <Card className="border-none  p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📅 7-Day Extended Forecast
                </h3>
                <div className="space-y-3">
                  {weeklyForecast.map((day: any, index: number) => (
                    <div key={day.dt} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-semibold w-20 text-sm">
                          {index === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={iconUrl(day.weather[0].icon)} alt="weather" className="w-12 h-12" />
                        <div className="flex-1">
                          <div className="font-medium capitalize">{day.weather[0].description}</div>
                          <div className="text-sm text-muted-foreground">
                            💧 {day.main.humidity}% • 🌪️ {Math.round((day.wind?.speed || 0) * 3.6)} km/h
                            {day.clouds?.all && ` • ☁️ ${day.clouds.all}%`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">{Math.round(day.main.temp)}°</div>
                        <div className="text-sm text-muted-foreground">
                          L: {Math.round(day.main.temp_min)}° H: {Math.round(day.main.temp_max)}°
                        </div>
                        {day.pop && day.pop > 0.1 && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {Math.round(day.pop * 100)}% rain
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
