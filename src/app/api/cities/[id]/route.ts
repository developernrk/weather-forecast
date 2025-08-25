import { NextResponse } from 'next/server';
import { removeFavoriteCity } from '@/lib/weather';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = String(params.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    await removeFavoriteCity(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to remove city' }, { status: 500 });
  }
}