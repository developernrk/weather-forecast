import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENWEATHER_API_KEY');
    }

    // Use One Call API 3.0 for weather alerts
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${apiKey}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch weather alerts');
    }

    const data = await res.json();
    
    return NextResponse.json({
      alerts: data.alerts || [],
      current: data.current,
      hourly: data.hourly?.slice(0, 24) || [], // Next 24 hours
      daily: data.daily?.slice(0, 7) || [], // Next 7 days
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to fetch weather alerts' }, { status: 500 });
  }
}