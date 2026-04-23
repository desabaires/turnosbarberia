// Info del shop actual. Centralizado para facilitar la migración a multi-tenant:
// cuando exista la tabla `shops`, este módulo pasa a hacer lookup por contexto
// (slug en URL para cliente, shop_id del user para admin).
export const SHOP = {
  name: 'Barbería Demo',
  address: '',
  city: 'Buenos Aires',
} as const;

export const PRODUCT = {
  name: 'TurnosBarbería',
  tagline: 'Reservá tu turno en segundos. Sin llamadas, sin esperas.',
} as const;
