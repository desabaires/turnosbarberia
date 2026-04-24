'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAdminShop } from '@/lib/shop-context';
import { slugify } from '@/lib/slug';

const NAME_LINE_RE = /^[\p{L}\p{N}\s'.,&·()-]{2,80}$/u;
const PHONE_RE = /^[+\d\s()-]{6,30}$/;

// ─── Shop ────────────────────────────────────────────────────────────────────

export async function updateShop(input: {
  name: string;
  address?: string;
  phone?: string;
  timezone?: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  const name = (input.name || '').trim();
  if (!NAME_LINE_RE.test(name)) return { error: 'Nombre inválido' };

  const address = (input.address || '').trim().slice(0, 160) || null;
  const phone = (input.phone || '').trim().slice(0, 30);
  if (phone && !PHONE_RE.test(phone)) return { error: 'Teléfono inválido' };
  const timezone = (input.timezone || '').trim().slice(0, 60) || shop.timezone;

  const supabase = createClient();
  const { error } = await supabase
    .from('shops')
    .update({ name, address, phone: phone || null, timezone })
    .eq('id', shop.id);
  if (error) return { error: error.message };

  revalidatePath('/shop/ajustes');
  revalidatePath('/shop');
  return { ok: true };
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function upsertService(input: {
  id?: string;
  name: string;
  duration_mins: number;
  price: number;
  description?: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  const name = (input.name || '').trim();
  if (!NAME_LINE_RE.test(name)) return { error: 'Nombre de servicio inválido' };
  const duration = Math.floor(Number(input.duration_mins) || 0);
  if (duration < 5 || duration > 480) return { error: 'Duración fuera de rango (5-480 min)' };
  const price = Math.max(0, Number(input.price) || 0);
  if (price > 10_000_000) return { error: 'Precio demasiado alto' };
  const description = (input.description || '').trim().slice(0, 240) || null;

  const supabase = createClient();
  if (input.id) {
    const { error } = await supabase
      .from('services')
      .update({ name, duration_mins: duration, price, description })
      .eq('id', input.id)
      .eq('shop_id', shop.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('services')
      .insert({ shop_id: shop.id, name, duration_mins: duration, price, description, is_active: true });
    if (error) return { error: error.message };
  }
  revalidatePath('/shop/ajustes');
  revalidatePath(`/s/${shop.slug}`);
  return { ok: true };
}

export async function toggleService(id: string, active: boolean) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('services')
    .update({ is_active: active })
    .eq('id', id)
    .eq('shop_id', shop.id);
  if (error) return { error: error.message };
  revalidatePath('/shop/ajustes');
  revalidatePath(`/s/${shop.slug}`);
  return { ok: true };
}

// ─── Barbers ─────────────────────────────────────────────────────────────────

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function upsertBarber(input: {
  id?: string;
  name: string;
  role?: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  const name = (input.name || '').trim();
  if (!NAME_LINE_RE.test(name)) return { error: 'Nombre inválido' };
  const role = (input.role || '').trim().slice(0, 60) || null;

  const supabase = createClient();

  if (input.id) {
    const { error } = await supabase
      .from('barbers')
      .update({ name, role, initials: initialsFrom(name) })
      .eq('id', input.id)
      .eq('shop_id', shop.id);
    if (error) return { error: error.message };
  } else {
    // Compute unique slug within shop.
    const base = slugify(name) || 'barbero';
    let slug = base;
    let n = 2;
    while (true) {
      const { data: exists } = await supabase
        .from('barbers')
        .select('id')
        .eq('shop_id', shop.id)
        .eq('slug', slug)
        .maybeSingle();
      if (!exists) break;
      slug = `${base}-${n++}`;
      if (n > 50) return { error: 'No se pudo generar un slug único' };
    }
    const { data: inserted, error } = await supabase
      .from('barbers')
      .insert({
        shop_id: shop.id,
        name,
        slug,
        role,
        initials: initialsFrom(name),
        hue: Math.floor(Math.random() * 360),
        is_active: true
      })
      .select('id')
      .maybeSingle<{ id: string }>();
    if (error || !inserted) return { error: error?.message || 'Error al crear barbero' };

    // Default schedules (closed all week) para que el admin los configure luego.
    const scheds = Array.from({ length: 7 }, (_, day) => ({
      shop_id: shop.id,
      barber_id: inserted.id,
      day_of_week: day,
      start_time: '10:00',
      end_time: '20:00',
      is_working: day !== 0 // Domingo cerrado por default
    }));
    await supabase.from('schedules').insert(scheds);
  }

  revalidatePath('/shop/ajustes');
  revalidatePath('/shop/equipo');
  revalidatePath(`/s/${shop.slug}`);
  return { ok: true };
}

export async function toggleBarber(id: string, active: boolean) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('barbers')
    .update({ is_active: active })
    .eq('id', id)
    .eq('shop_id', shop.id);
  if (error) return { error: error.message };
  revalidatePath('/shop/ajustes');
  revalidatePath('/shop/equipo');
  return { ok: true };
}

// ─── Schedules ───────────────────────────────────────────────────────────────

export async function updateSchedules(
  barberId: string,
  days: Array<{ day_of_week: number; start_time: string; end_time: string; is_working: boolean }>
) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };

  // Validar que el barbero pertenezca al shop.
  const supabase = createClient();
  const { data: b } = await supabase
    .from('barbers').select('id').eq('id', barberId).eq('shop_id', shop.id).maybeSingle();
  if (!b) return { error: 'Barbero no encontrado' };

  const timeRe = /^\d{2}:\d{2}(:\d{2})?$/;
  for (const d of days) {
    if (d.day_of_week < 0 || d.day_of_week > 6) return { error: 'Día inválido' };
    if (!timeRe.test(d.start_time) || !timeRe.test(d.end_time)) return { error: 'Hora inválida' };
  }

  // Upsert via delete + insert (más simple que batch upsert).
  const { error: delErr } = await supabase
    .from('schedules').delete().eq('shop_id', shop.id).eq('barber_id', barberId);
  if (delErr) return { error: delErr.message };

  const rows = days.map(d => ({
    shop_id: shop.id,
    barber_id: barberId,
    day_of_week: d.day_of_week,
    start_time: d.start_time,
    end_time: d.end_time,
    is_working: !!d.is_working
  }));
  const { error } = await supabase.from('schedules').insert(rows);
  if (error) return { error: error.message };

  revalidatePath('/shop/ajustes');
  revalidatePath('/shop/equipo');
  revalidatePath(`/s/${shop.slug}`);
  return { ok: true };
}
