import { NextResponse } from 'next/server';
import { removeFavoriteCity } from '@/lib/weather';

// Use a flexible context type to satisfy Next.js handler validation
export async function DELETE(
  _req: Request,
  context: any
) {
  try {
    const id = String(context?.params?.id);

    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await removeFavoriteCity(id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to remove city' },
      { status: 500 }
    );
  }
}