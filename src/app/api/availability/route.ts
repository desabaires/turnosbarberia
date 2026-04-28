import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/availability';
import { getShopBySlug } from '@/lib/shop-context';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shopSlug');
  const shopIdParam = searchParams.get('shopId');
  const barberId = searchParams.get('barberId');
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');

  if (!barberId || !serviceId || !date || (!shopSlug && !shopIdParam)) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: 'bad date' }, { status: 400 });
  }
  if (!UUID_RE.test(serviceId)) {
    return NextResponse.json({ error: 'bad serviceId' }, { status: 400 });
  }
  if (barberId !== 'any' && !UUID_RE.test(barberId)) {
    return NextResponse.json({ error: 'bad barberId' }, { status: 400 });
  }
  if (shopIdParam && !UUID_RE.test(shopIdParam)) {
    return NextResponse.json({ error: 'bad shopId' }, { status: 400 });
  }
  if (shopSlug && !SLUG_RE.test(shopSlug)) {
    return NextResponse.json({ error: 'bad shopSlug' }, { status: 400 });
  }

  // Si vienen ambos, validamos que matchean — un atacante podría intentar
  // pedir la disponibilidad de otro shop pasando shopSlug=propio + shopId=ajeno.
  let shopId: string | null = null;
  if (shopSlug) {
    const shop = await getShopBySlug(shopSlug);
    if (!shop) return NextResponse.json({ error: 'shop not found' }, { status: 404 });
    if (shopIdParam && shopIdParam !== shop.id) {
      return NextResponse.json({ error: 'shop mismatch' }, { status: 400 });
    }
    shopId = shop.id;
  } else if (shopIdParam) {
    shopId = shopIdParam;
  }
  if (!shopId) return NextResponse.json({ error: 'missing shop' }, { status: 400 });

  if (barberId === 'any') {
    // For "Cualquiera" we union slots across all active barbers in this shop
    const { createClient } = await import('@/lib/supabase/server');
    const sb = createClient();
    const { data: barbers } = await sb
      .from('barbers').select('id').eq('shop_id', shopId).eq('is_active', true);
    const all = await Promise.all((barbers || []).map(b => getAvailableSlots(shopId!, b.id, serviceId, date)));
    const map = new Map<string, { time: string; iso: string; taken: boolean }>();
    for (const slots of all) {
      for (const s of slots) {
        const cur = map.get(s.time);
        if (!cur || (cur.taken && !s.taken)) map.set(s.time, s);
      }
    }
    return NextResponse.json({ slots: Array.from(map.values()).sort((a,b) => a.time.localeCompare(b.time)) });
  }
  const slots = await getAvailableSlots(shopId, barberId, serviceId, date);
  return NextResponse.json({ slots });
}
