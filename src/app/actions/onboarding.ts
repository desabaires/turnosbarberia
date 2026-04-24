'use server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slug';
import { revalidatePath } from 'next/cache';
import { sendNewShopNotificationToSuperAdmin } from '@/lib/email';

const RESERVED_SLUGS = new Set(['s', 'shop', 'admin', 'api', 'auth', 'login', 'registro', 'onboarding']);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$/;

export type DaySchedule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

export type CreateShopInput = {
  shop: { name: string; slug: string; address?: string; phone?: string };
  services: Array<{ name: string; duration_mins: number; price: number }>;
  barbers: Array<{ name: string; role?: string }>;
  schedules: {
    perBarber: boolean;
    general?: DaySchedule[];
    byBarber?: Record<string, DaySchedule[]>;
  };
};

function validateSlugShape(slug: string): { ok: true } | { ok: false; reason: string } {
  if (!slug || slug.length < 3) return { ok: false, reason: 'Muy corto (mínimo 3 caracteres)' };
  if (slug.length > 42) return { ok: false, reason: 'Muy largo (máximo 42 caracteres)' };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: 'Solo letras minúsculas, números y guiones' };
  if (slug.includes('--')) return { ok: false, reason: 'No uses guiones dobles' };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: 'Este nombre está reservado' };
  return { ok: true };
}

export async function checkSlugAvailable(slug: string): Promise<{ available: boolean; reason?: string }> {
  const normalized = (slug || '').trim().toLowerCase();
  const shape = validateSlugShape(normalized);
  if (!shape.ok) return { available: false, reason: shape.reason };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('shops')
    .select('id')
    .eq('slug', normalized)
    .maybeSingle();
  if (error) return { available: false, reason: 'No se pudo validar, reintentá' };
  if (data) return { available: false, reason: 'Ya está en uso' };
  return { available: true };
}

function dedupeBarberSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) { used.add(base); return base; }
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  const out = `${base}-${n}`;
  used.add(out);
  return out;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const NAME_LINE_RE = /^[\p{L}\p{N}\s'.,&·()-]{2,80}$/u;

export async function createShop(input: CreateShopInput): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Necesitás iniciar sesión' };

  const shopName = (input.shop?.name || '').trim();
  const shopSlug = (input.shop?.slug || '').trim().toLowerCase();
  if (!NAME_LINE_RE.test(shopName)) {
    return { error: 'El nombre de la barbería es inválido o muy largo' };
  }

  const shape = validateSlugShape(shopSlug);
  if (!shape.ok) return { error: `Slug inválido: ${shape.reason}` };

  const shopAddress = (input.shop?.address || '').trim().slice(0, 160);
  const shopPhone = (input.shop?.phone || '').trim().slice(0, 30);

  const services = (input.services || []).map(s => ({
    name: (s.name || '').trim().slice(0, 80),
    duration_mins: Math.floor(Number(s.duration_mins) || 0),
    price: Math.max(0, Number(s.price) || 0)
  })).filter(s =>
    NAME_LINE_RE.test(s.name)
    && s.duration_mins >= 5
    && s.duration_mins <= 480
    && s.price <= 10_000_000
  );
  if (services.length === 0) return { error: 'Agregá al menos un servicio válido' };
  if (services.length > 30) return { error: 'Máximo 30 servicios por barbería' };

  const barbers = (input.barbers || []).map(b => ({
    name: (b.name || '').trim().slice(0, 60),
    role: (b.role || '').trim().slice(0, 60) || null
  })).filter(b => NAME_LINE_RE.test(b.name));
  if (barbers.length === 0) return { error: 'Agregá al menos un barbero' };
  if (barbers.length > 50) return { error: 'Máximo 50 barberos por barbería' };

  const perBarber = !!input.schedules?.perBarber;
  const generalSched = (input.schedules?.general || []) as DaySchedule[];
  const byBarberSched = (input.schedules?.byBarber || {}) as Record<string, DaySchedule[]>;
  if (!perBarber && generalSched.length === 0) {
    return { error: 'Falta configurar los horarios' };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .maybeSingle();
  if (existing) return { error: 'Ese slug ya está en uso, elegí otro' };

  const { data: shopRow, error: shopErr } = await admin
    .from('shops')
    .insert({
      name: shopName,
      slug: shopSlug,
      address: shopAddress || null,
      phone: shopPhone || null,
      owner_id: user.id,
      is_active: false
    })
    .select('id, slug')
    .single();

  if (shopErr || !shopRow) {
    return { error: 'No se pudo crear la barbería: ' + (shopErr?.message || 'desconocido') };
  }

  const shopId = shopRow.id as string;

  const cleanup = async () => {
    await admin.from('shops').delete().eq('id', shopId);
  };

  const { error: svcErr } = await admin.from('services').insert(
    services.map(s => ({
      shop_id: shopId,
      name: s.name,
      duration_mins: s.duration_mins,
      price: s.price,
      is_active: true
    }))
  );
  if (svcErr) {
    await cleanup();
    return { error: 'No se pudieron crear los servicios: ' + svcErr.message };
  }

  const usedSlugs = new Set<string>();
  const barberRows = barbers.map((b, idx) => {
    const baseSlug = slugify(b.name) || `barbero-${idx + 1}`;
    const slug = dedupeBarberSlug(baseSlug, usedSlugs);
    return {
      shop_id: shopId,
      name: b.name,
      slug,
      role: b.role,
      initials: initialsFrom(b.name),
      hue: Math.floor(Math.random() * 360),
      is_active: true
    };
  });

  const { data: insertedBarbers, error: barErr } = await admin
    .from('barbers')
    .insert(barberRows)
    .select('id');
  if (barErr || !insertedBarbers) {
    await cleanup();
    return { error: 'No se pudieron crear los barberos: ' + (barErr?.message || 'desconocido') };
  }

  const schedInserts: Array<{
    shop_id: string;
    barber_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
  }> = [];

  insertedBarbers.forEach((bRow: any, idx: number) => {
    const source: DaySchedule[] = perBarber
      ? (byBarberSched[String(idx)] || generalSched || [])
      : generalSched;
    for (let day = 0; day < 7; day++) {
      const slot = source.find(d => d.day_of_week === day);
      schedInserts.push({
        shop_id: shopId,
        barber_id: bRow.id,
        day_of_week: day,
        start_time: slot?.start_time || '10:00',
        end_time: slot?.end_time || '20:00',
        is_working: slot ? !!slot.is_working : false
      });
    }
  });

  if (schedInserts.length > 0) {
    const { error: schedErr } = await admin.from('schedules').insert(schedInserts);
    if (schedErr) {
      await cleanup();
      return { error: 'No se pudieron crear los horarios: ' + schedErr.message };
    }
  }

  // Aviso al super-admin (no bloqueante).
  try {
    await sendNewShopNotificationToSuperAdmin({
      slug: shopRow.slug,
      name: shopName,
      ownerEmail: user.email || '(sin email)'
    });
  } catch { /* silencioso */ }

  revalidatePath('/shop');
  revalidatePath(`/s/${shopRow.slug}`);
  revalidatePath('/', 'layout');
  return {};
}
