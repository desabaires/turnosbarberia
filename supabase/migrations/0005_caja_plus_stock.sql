-- ============================================================================
-- TurnosBarbería — Caja+, stock avanzado, egresos y plan por shop.
--
-- Expande `sales` (description + tipo 'other'), `products` (provider/unit/cost),
-- crea `expenses` para gastos del día y suma `plan` en `shops`.
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- sale_type: agregar valor 'other' (cobro libre)
-- ---------------------------------------------------------------------------
alter type sale_type add value if not exists 'other';

-- ---------------------------------------------------------------------------
-- sales: description (cobros libres sin turno ni producto)
-- ---------------------------------------------------------------------------
alter table public.sales
  add column if not exists description text;

-- ---------------------------------------------------------------------------
-- products: provider, unit, cost (para margen y stock real)
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists provider text;

alter table public.products
  add column if not exists unit text not null default 'unidad';

alter table public.products
  add column if not exists cost numeric(10,2);

-- ---------------------------------------------------------------------------
-- shops.plan (starter | pro). Default 'starter'.
-- ---------------------------------------------------------------------------
alter table public.shops
  add column if not exists plan text not null default 'starter';

-- ---------------------------------------------------------------------------
-- expenses (egresos de caja)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  category    text not null,
  description text,
  amount      numeric(10,2) not null check (amount >= 0),
  payment_method payment_method not null default 'efectivo',
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists expenses_shop_paid_idx on public.expenses(shop_id, paid_at);

alter table public.expenses enable row level security;

drop policy if exists "expenses admin" on public.expenses;
create policy "expenses admin"
  on public.expenses for all
  using (public.is_admin() and shop_id = public.current_shop_id())
  with check (public.is_admin() and shop_id = public.current_shop_id());

-- ---------------------------------------------------------------------------
-- Realtime: agregar expenses a la publicación
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null;
when others then null;
end $$;
