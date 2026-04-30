-- ============================================================================
-- Comisión por barbero
--
-- Cada barbero cobra un % del precio del servicio que realiza. Default 50%
-- — un valor neutro mientras el dueño no lo configura. La columna es nullable
-- para no asumir un default fijo en lecturas viejas, pero el insert por
-- código siempre debería setear un valor.
-- ============================================================================

alter table public.barbers
  add column if not exists commission_pct numeric(5, 2) not null default 50.00
  check (commission_pct >= 0 and commission_pct <= 100);
