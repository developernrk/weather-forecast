import { NextResponse } from 'next/server';
import { getCurrentWeatherForCity, getForecastForCity, searchCity } from '@/lib/weather';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || searchParams.get('city');
    const search = searchParams.get('search');

    if (search) {
      const results = await searchCity(search);
      return NextResponse.json({ results });
    }

    if (!q) return NextResponse.json({ error: 'Missing city query ?q=' }, { status: 400 });

    // Support "City,CC" where CC is country code
    const [name, countryRaw] = q.split(',').map((s) => s.trim());
    const country = countryRaw ? countryRaw.toUpperCase() : undefined;

    const [current, forecast] = await Promise.all([
      getCurrentWeatherForCity(name, country),
      getForecastForCity(name, country),
    ]);

    return NextResponse.json({ current, forecast });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to fetch weather' }, { status: 500 });
  }
}