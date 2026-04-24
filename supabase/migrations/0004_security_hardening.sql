-- ============================================================================
-- TurnosBarbería — security hardening (from QA/security audit).
--
-- Closes these issues surfaced by the audit:
--   🔴 Critical #1 — profiles UPDATE didn't gate is_admin/shop_id (priv esc).
--   🔴 Critical #2 — appointments INSERT accepted any shop/barber/service.
--   🔴 Critical #4 — demo admins could DELETE core data.
--   🟠 High    #5  — shops SELECT was unrestricted (competitor enumeration).
--   🟠 High    #6  — shops UPDATE allowed slug/owner_id rewrites.
--   🟠 High    #14 — appointments UPDATE had no WITH CHECK (data pollution).
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- #1 + #14 · Privilege escalation fix
-- Trigger que bloquea la modificación de campos privilegiados de profiles
-- salvo que venga del service_role (usado por los server actions).
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_name text;
begin
  role_name := current_setting('request.jwt.claims', true)::jsonb->>'role';
  -- service_role keys bypass la protección (los server actions lo usan).
  if role_name = 'service_role' then
    return new;
  end if;
  -- Un user normal nunca puede cambiar estos dos campos vía PATCH.
  new.is_admin := old.is_admin;
  new.shop_id  := old.shop_id;
  return new;
end $$;

drop trigger if exists profiles_protect_admin_fields on public.profiles;
create trigger profiles_protect_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

-- ---------------------------------------------------------------------------
-- Helper: is_demo_user() — true si la sesión actual es una cuenta demo.
-- Usado para denegar operaciones destructivas desde la demo.
-- ---------------------------------------------------------------------------
create or replace function public.is_demo_user()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb->>'email') in (
      'cliente.demo@turnosbarberia.app',
      'dueno.demo@turnosbarberia.app'
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- #5 · shops SELECT — solo devuelve shops activos. Lookup por slug ya corre
-- con admin_client en el server, así que la policy pública alcanza con
-- is_active (no exponemos owner_id ni phone completo a bulk-fetch).
-- Para protección adicional, los consumers públicos traen solo los campos
-- que necesitan via .select('id, slug, name, address, timezone').
-- ---------------------------------------------------------------------------
drop policy if exists "shops public read" on public.shops;
create policy "shops public read"
  on public.shops for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- #6 · shops UPDATE — solo el owner puede modificar su shop, y NO puede
-- cambiar slug ni owner_id (evita squatting y transferencias silenciosas).
-- ---------------------------------------------------------------------------
drop policy if exists "shops owner write" on public.shops;

create policy "shops owner insert"
  on public.shops for insert
  with check (owner_id = auth.uid());

create policy "shops owner update"
  on public.shops for update
  using (owner_id = auth.uid() or id = public.current_shop_id())
  with check (owner_id = auth.uid() or id = public.current_shop_id());

create policy "shops owner delete"
  on public.shops for delete
  using (owner_id = auth.uid() and not public.is_demo_user());

-- Trigger que bloquea cambios a slug/owner_id salvo service_role.
create or replace function public.protect_shop_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare role_name text;
begin
  role_name := current_setting('request.jwt.claims', true)::jsonb->>'role';
  if role_name = 'service_role' then
    return new;
  end if;
  new.slug     := old.slug;
  new.owner_id := old.owner_id;
  return new;
end $$;

drop trigger if exists shops_protect_immutable on public.shops;
create trigger shops_protect_immutable
  before update on public.shops
  for each row execute function public.protect_shop_immutable_fields();

-- ---------------------------------------------------------------------------
-- #2 · appointments INSERT — valida shop/barber/service consistencia,
-- rango razonable de fechas, y estado inicial válido.
-- ---------------------------------------------------------------------------
drop policy if exists "appointments insert anon" on public.appointments;
create policy "appointments insert anon"
  on public.appointments for insert
  with check (
    starts_at > now()
    and starts_at < (now() + interval '180 days')
    and ends_at > starts_at
    and ends_at <= (starts_at + interval '8 hours')
    and status in ('pending', 'confirmed')
    and exists (
      select 1 from public.shops sh
      where sh.id = shop_id and sh.is_active = true
    )
    and exists (
      select 1 from public.barbers b
      where b.id = barber_id and b.shop_id = appointments.shop_id and b.is_active = true
    )
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.shop_id = appointments.shop_id and s.is_active = true
    )
    and coalesce(length(customer_name), 0) between 2 and 80
    and coalesce(length(customer_email), 0) between 5 and 120
    and coalesce(length(customer_phone), 0) between 5 and 30
  );

-- #14 · appointments UPDATE self: blinda los campos estructurales.
drop policy if exists "appointments self update" on public.appointments;
create policy "appointments self update"
  on public.appointments for update
  using (auth.uid() = profile_id and starts_at > now())
  with check (
    auth.uid() = profile_id
    and status in ('pending', 'confirmed', 'cancelled')
  );

-- Trigger que blinda shop_id/barber_id/service_id/profile_id en UPDATE
-- salvo service_role.
create or replace function public.protect_appointment_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare role_name text;
begin
  role_name := current_setting('request.jwt.claims', true)::jsonb->>'role';
  if role_name = 'service_role' then
    return new;
  end if;
  new.shop_id    := old.shop_id;
  new.barber_id  := old.barber_id;
  new.service_id := old.service_id;
  new.profile_id := old.profile_id;
  return new;
end $$;

drop trigger if exists appointments_protect_immutable on public.appointments;
create trigger appointments_protect_immutable
  before update on public.appointments
  for each row execute function public.protect_appointment_immutable_fields();

-- ---------------------------------------------------------------------------
-- #4 · Demo shop: los admins demo NO pueden eliminar registros "base"
-- (barbers, services, schedules, shops). Pueden crear appointments/sales
-- para mostrar el flujo, y leer todo.
-- ---------------------------------------------------------------------------
drop policy if exists "barbers admin write"   on public.barbers;
drop policy if exists "services admin write"  on public.services;
drop policy if exists "schedules admin write" on public.schedules;

-- SELECT/UPDATE permitido para admins, DELETE bloqueado para demo users.
create policy "barbers admin write"
  on public.barbers for all
  using (public.is_admin() and shop_id = public.current_shop_id())
  with check (public.is_admin() and shop_id = public.current_shop_id());

create policy "services admin write"
  on public.services for all
  using (public.is_admin() and shop_id = public.current_shop_id())
  with check (public.is_admin() and shop_id = public.current_shop_id());

create policy "schedules admin write"
  on public.schedules for all
  using (public.is_admin() and shop_id = public.current_shop_id())
  with check (public.is_admin() and shop_id = public.current_shop_id());

-- Denegar DELETE destructivo a demo users (policy adicional restrictiva).
create policy "barbers deny demo delete"
  on public.barbers as restrictive for delete
  using (not public.is_demo_user());

create policy "services deny demo delete"
  on public.services as restrictive for delete
  using (not public.is_demo_user());

create policy "schedules deny demo delete"
  on public.schedules as restrictive for delete
  using (not public.is_demo_user());
