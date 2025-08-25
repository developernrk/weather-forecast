import { NextResponse } from 'next/server';
import { addFavoriteCity, listFavoriteCities, removeFavoriteCity } from '@/lib/weather';
import { ensurePreferenceId } from '@/lib/prefs';

export async function GET() {
  try {
    // Ensure cookie exists for this browser
    await ensurePreferenceId();

    const cities = await listFavoriteCities();

    return NextResponse.json({ cities });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to list cities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensurePreferenceId();

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? '').trim();
    const country = (body?.country ? String(body.country).trim() : '').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const city = await addFavoriteCity(name, country || undefined);

    return NextResponse.json({ city }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to add city' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensurePreferenceId();

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 });
    }

    await removeFavoriteCity(cityId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to remove city' }, { status: 500 });
  }
}