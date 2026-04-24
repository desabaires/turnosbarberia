'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAdminShop } from '@/lib/shop-context';
import type { PaymentMethod } from '@/types/db';

const PAYMENT_METHODS: PaymentMethod[] = ['efectivo', 'transferencia', 'debito', 'credito'];

function validMethod(m: string): m is PaymentMethod {
  return (PAYMENT_METHODS as string[]).includes(m);
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export async function recordAppointmentSale(input: {
  appointmentId: string;
  amount: number;
  paymentMethod: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido' };
  if (!validMethod(input.paymentMethod)) return { error: 'Método inválido' };

  const supabase = createClient();
  // Validate appt pertenece al shop.
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, customer_name, shop_id')
    .eq('id', input.appointmentId)
    .eq('shop_id', shop.id)
    .maybeSingle<{ id: string; customer_name: string; shop_id: string }>();
  if (!appt) return { error: 'Turno no encontrado' };

  // Evitar cobros duplicados por turno.
  const { data: existing } = await supabase
    .from('sales').select('id').eq('shop_id', shop.id).eq('appointment_id', input.appointmentId).maybeSingle();
  if (existing) return { error: 'Ese turno ya fue cobrado' };

  const { error } = await supabase.from('sales').insert({
    shop_id: shop.id,
    type: 'service',
    appointment_id: input.appointmentId,
    amount,
    payment_method: input.paymentMethod,
    customer_name: appt.customer_name
  });
  if (error) return { error: error.message };

  revalidatePath('/shop/caja');
  revalidatePath('/shop');
  return { ok: true };
}

export async function recordWalkInSale(input: {
  description: string;
  amount: number;
  paymentMethod: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido' };
  if (!validMethod(input.paymentMethod)) return { error: 'Método inválido' };
  const description = (input.description || '').trim().slice(0, 120);
  if (!description) return { error: 'Ingresá una descripción' };

  const supabase = createClient();
  const { error } = await supabase.from('sales').insert({
    shop_id: shop.id,
    type: 'other',
    amount,
    payment_method: input.paymentMethod,
    description
  });
  if (error) return { error: error.message };

  revalidatePath('/shop/caja');
  return { ok: true };
}

export async function recordProductSale(input: {
  productId: string;
  quantity: number;
  paymentMethod: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };
  if (!validMethod(input.paymentMethod)) return { error: 'Método inválido' };
  const qty = Math.floor(Number(input.quantity) || 0);
  if (qty <= 0) return { error: 'Cantidad inválida' };

  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('id, name, price, stock, shop_id')
    .eq('id', input.productId)
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .maybeSingle<{ id: string; name: string; price: number; stock: number; shop_id: string }>();
  if (!product) return { error: 'Producto no encontrado' };
  if (product.stock < qty) return { error: `Stock insuficiente (${product.stock} disponibles)` };

  const amount = Number(product.price) * qty;

  const { error: insErr } = await supabase.from('sales').insert({
    shop_id: shop.id,
    type: 'product',
    product_id: product.id,
    amount,
    payment_method: input.paymentMethod,
    description: qty > 1 ? `${product.name} x${qty}` : product.name
  });
  if (insErr) return { error: insErr.message };

  // Decrementar stock.
  const { error: stockErr } = await supabase
    .from('products')
    .update({ stock: product.stock - qty })
    .eq('id', product.id)
    .eq('shop_id', shop.id);
  if (stockErr) return { error: 'Venta registrada pero no se pudo actualizar stock: ' + stockErr.message };

  revalidatePath('/shop/caja');
  return { ok: true };
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function recordExpense(input: {
  category: string;
  description?: string;
  amount: number;
  paymentMethod: string;
}) {
  const shop = await getAdminShop();
  if (!shop) return { error: 'No autorizado' };
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido' };
  if (!validMethod(input.paymentMethod)) return { error: 'Método inválido' };
  const category = (input.category || '').trim().slice(0, 40);
  if (!category) return { error: 'Elegí una categoría' };
  const description = (input.description || '').trim().slice(0, 200) || null;

  const supabase = createClient();
  const { error } = await supabase.from('expenses').insert({
    shop_id: shop.id,
    category,
    description,
    amount,
    payment_method: input.paymentMethod
  });
  if (error) return { error: error.message };

  revalidatePath('/shop/caja');
  revalidatePath('/shop/dashboard');
  return { ok: true };
}
