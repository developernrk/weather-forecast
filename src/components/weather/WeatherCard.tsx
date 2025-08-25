"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import WeatherDetails from "./WeatherDetails";

export type WeatherData = {
  id: string;
  name: string;
  country?: string;
  current?: {
    dt?: number;
    main?: {
      temp?: number;
      humidity?: number;
      pressure?: number;
      feels_like?: number;
      temp_min?: number;
      temp_max?: number;
    };
    weather?: { main: string; description: string; icon: string }[];
    wind?: { speed?: number; deg?: number; gust?: number };
    clouds?: { all?: number };
    visibility?: number;
    sys?: { sunrise?: number; sunset?: number; country?: string };
  };
  forecast?: {
    list: {
      dt: number;
      main: {
        temp: number;
        temp_min: number;
        temp_max: number;
        humidity: number;
      };
      weather: { icon: string; description: string; main: string }[];
      wind?: { speed: number; deg: number };
      pop?: number; // Probability of precipitation
    }[];
  };
};

export default function WeatherCard({
  title,
  current,
  forecast,
  cityId,
  onRemove,
  city,
}: {
  title: string;
  current?: WeatherData["current"];
  forecast?: WeatherData["forecast"];
  cityId?: string;
  onRemove?: (cityId: string) => void;
  city?: {
    id: string;
    name: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
}) {
  const [open, setOpen] = useState(false);

  // Condense forecast to one item per day (approx 5 days)
  const daily = (forecast?.list || [])
    .filter((_, i) => i % 8 === 0)
    .slice(0, 5);

  const iconUrl = (icon?: string) => (icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : undefined);

  const handleRemove = async () => {
    if (onRemove && cityId) onRemove(cityId);
  };

  const getWindDirection = (deg: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(deg / 45) % 8];
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "--";
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeatherGradient = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes("clear") || cond.includes("sunny")) {
      return "from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950 dark:via-orange-950 dark:to-yellow-950";
    }
    if (cond.includes("cloud")) {
      return "from-gray-50 via-slate-50 to-gray-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900";
    }
    if (cond.includes("rain")) {
      return "from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950 dark:via-indigo-950 dark:to-blue-950";
    }
    if (cond.includes("snow")) {
      return "from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900";
    }
    return "from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900";
  };

  const weatherCondition = current?.weather?.[0]?.main || "";
  const bgGradient = getWeatherGradient(weatherCondition);

  return (
    <Card className={`w-full max-w-7xl overflow-hidden bg-gradient-to-br ${bgGradient} rounded-2xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-[1.01]`}>
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {current?.dt
                ? new Date(current.dt * 1000).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Today"}
            </p>
          </div>

          {cityId && onRemove && (
            <button
              aria-label="remove city"
              className="group relative size-8 rounded-full grid place-items-center hover:scale-105 transition-all text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleRemove}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Compact Current Weather - key info only */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10 blur-xl animate-pulse"></div>
          </div>
          {current?.weather?.[0]?.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="weather icon" src={iconUrl(current.weather[0].icon)} className="w-16 h-16 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">
                {typeof current?.main?.temp === "number" ? Math.round(current.main.temp) : "--"}°C
              </span>
              <span className="text-sm text-muted-foreground truncate">
                Feels {typeof current?.main?.feels_like === "number" ? Math.round(current.main.feels_like) : "--"}°C
              </span>
            </div>
            <div className="text-sm text-muted-foreground capitalize truncate">
              {current?.weather?.[0]?.description ?? "No data"}
            </div>
          </div>
        </div>
      </div>

      {/* Condensed 5-Day Forecast: single-row strip */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2">
          {daily.map((d, index) => (
            <div
              key={d.dt}
              className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 shadow-sm hover:shadow-md transition-all min-w-[72px]"
            >
              <div className="text-[11px] text-foreground/80">
                {index === 0
                  ? "Today"
                  : new Date(d.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              {d.weather?.[0]?.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="forecast" src={iconUrl(d.weather[0].icon)} className="w-8 h-8" />
              )}
              <div className="text-xs font-semibold text-foreground drop-shadow-sm">{Math.round(d.main.temp)}°</div>
              <div className="text-[10px] text-muted-foreground">
                {Math.round(d.main.temp_min)}°/{Math.round(d.main.temp_max)}°
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible: move details inside */}
      <div className="px-4 pb-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span>Details</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </CollapsibleTrigger>

            {city && (
              <div className="ml-auto">
                <WeatherDetails city={city} current={current} forecast={forecast} />
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Humidity:</span>
                <span>{current?.main?.humidity ?? "--"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pressure:</span>
                <span>{current?.main?.pressure ?? "--"} hPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wind:</span>
                <span>
                  {current?.wind?.speed ? `${Math.round(current.wind.speed * 3.6)} km/h` : "--"}
                  {current?.wind?.deg ? ` ${getWindDirection(current.wind.deg)}` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clouds:</span>
                <span>{current?.clouds?.all ?? "--"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunrise:</span>
                <span>{formatTime(current?.sys?.sunrise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunset:</span>
                <span>{formatTime(current?.sys?.sunset)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}