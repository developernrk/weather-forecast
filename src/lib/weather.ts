import 'server-only';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

// Simple OpenWeatherMap wrappers with DB-backed caching
// Expect env OPENWEATHER_API_KEY and CACHE_TTL_MINUTES (optional)

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const DEFAULT_TTL_MIN = Number(process.env.CACHE_TTL_MINUTES ?? 10);

// Read-only preference id from cookie; route handlers should ensure it's set
async function getPreferenceId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get('prefId')?.value || jar.get('pref_id')?.value;
  return id ?? null;
}

export type CurrentWeather = {
  name: string;
  country?: string;
  coord: { lat: number; lon: number };
  main: { 
    temp: number; 
    humidity: number;
    pressure: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
  };
  weather: { main: string; description: string; icon: string }[];
  wind?: { speed: number; deg: number; gust?: number };
  clouds?: { all: number };
  visibility?: number;
  sys?: { country?: string; sunrise?: number; sunset?: number };
  dt: number;
};

export type ForecastItem = {
  dt: number;
  main: { 
    temp: number; 
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
    feels_like: number;
  };
  weather: { main: string; description: string; icon: string }[];
  wind?: { speed: number; deg: number; gust?: number };
  clouds?: { all: number };
  visibility?: number;
  pop?: number; // Probability of precipitation
  dt_txt?: string;
};

export type FiveDayForecast = {
  city: { name: string; country?: string };
  list: ForecastItem[];
};

function ttlDate(minutes = DEFAULT_TTL_MIN): Date {
  return new Date(Date.now() + minutes * 60_000);
}

async function upsertCity(name: string, country?: string, lat?: number, lon?: number) {
  return prisma.city.upsert({
    where: { name_country: { name, country: country ?? '' } as any },
    update: { country: country ?? '', lat, lon },
    create: { name, country: country ?? '', lat, lon },
  });
}

export async function searchCity(query: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENWEATHER_API_KEY');

  try {
    const url = `${GEO_BASE}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Geocoding API Error:', {
        status: res.status,
        statusText: res.statusText,
        url,
        response: errorText
      });
      throw new Error(`Geocoding API Error (${res.status}): ${res.statusText}`);
    }
    
    const data = (await res.json()) as { name: string; country?: string; lat: number; lon: number }[];
    return data.map((d) => ({ name: d.name, country: d.country, lat: d.lat, lon: d.lon }));
  } catch (error) {
    console.error(`Error searching for city "${query}":`, error);
    throw error;
  }
}

async function getCached(cityId: string, type: 'current' | 'forecast') {
  const now = new Date();
  const cache = await prisma.weatherCache.findUnique({ where: { cityId_type: { cityId, type } } as any });
  if (cache && cache.expiresAt > now) return cache.data as any;
  return null;
}

async function setCache(cityId: string, type: 'current' | 'forecast', data: any, minutes?: number) {
  return prisma.weatherCache.upsert({
    where: { cityId_type: { cityId, type } } as any,
    update: { data, expiresAt: ttlDate(minutes) },
    create: { cityId, type, data, expiresAt: ttlDate(minutes) },
  });
}

export async function getCurrentWeatherForCity(name: string, country?: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENWEATHER_API_KEY');

  try {
    // Ensure city exists in DB
    const city = await prisma.city.findUnique({ where: { name_country: { name, country: country ?? '' } as any } });
    const cityRecord = city ?? (await upsertCity(name, country));

    // Try cache
    const cached = await getCached(cityRecord.id, 'current');
    if (cached) return cached as CurrentWeather;

    const url = `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(name)}${country ? ',' + country : ''}&units=metric&appid=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Weather API Error:', {
        status: res.status,
        statusText: res.statusText,
        url,
        response: errorText
      });
      throw new Error(`Weather API Error (${res.status}): ${res.statusText}`);
    }
    
    const data = (await res.json()) as CurrentWeather;

    // Update city coords and country if provided
    if (data.coord) {
      await upsertCity(data.name, data?.sys?.country, data.coord?.lat, data.coord?.lon);
    }

    await setCache(cityRecord.id, 'current', data);
    return data;
  } catch (error) {
    console.error(`Error fetching weather for ${name}${country ? `, ${country}` : ''}:`, error);
    throw error;
  }
}

export async function getForecastForCity(name: string, country?: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENWEATHER_API_KEY');

  const city = await prisma.city.findUnique({ where: { name_country: { name, country: country ?? '' } as any } });
  const cityRecord = city ?? (await upsertCity(name, country));

  const cached = await getCached(cityRecord.id, 'forecast');
  if (cached) return cached as FiveDayForecast;

  const url = `${OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(name)}${country ? ',' + country : ''}&units=metric&appid=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = (await res.json()) as FiveDayForecast;

  await setCache(cityRecord.id, 'forecast', data, 30); // cache forecast a bit longer
  return data;
}

export async function addFavoriteCity(name: string, country?: string) {
  const city = await upsertCity(name, country);
  const prefId = await getPreferenceId();

  if (!prefId) {
    throw new Error('Preference cookie missing. Ensure it is set in a Route Handler.');
  }

  await prisma.userPreference.upsert({
    where: { id: prefId },
    update: {},
    create: { id: prefId },
  });

  await prisma.favoriteCity.upsert({
    where: { preferenceId_cityId: { preferenceId: prefId, cityId: city.id } } as any,
    update: {},
    create: { preferenceId: prefId, cityId: city.id as any },
  });

  return city;
}

export async function removeFavoriteCity(cityId: string) {
  const prefId = await getPreferenceId();

  if (!prefId) {
    throw new Error('Preference cookie missing. Ensure it is set in a Route Handler.');
  }

  await prisma.favoriteCity.delete({
    where: { preferenceId_cityId: { preferenceId: prefId, cityId } } as any,
  });
}

export async function listFavoriteCities() {
  const prefId = await getPreferenceId();

  if (!prefId) {
    return [];
  }

  const prefs = await prisma.userPreference.upsert({
    where: { id: prefId },
    create: { id: prefId },
    update: {},
    include: { cities: { include: { city: true } } },
  });

  // Normalize country empty string to undefined for UI
  return prefs.cities.map((c) => ({ ...c.city, country: c.city.country || undefined }));
}