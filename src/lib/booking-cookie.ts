// Cookie que guarda los IDs de appointments creados desde este browser.
// Se usa para mostrar la confirmation page a invitados (sin sesión) sin
// tener que exponer la data via UUID-guess.
//
// Formato: "id1,id2,id3" — lista de hasta N UUIDs más recientes.
// httpOnly para que no se pueda leer desde JS, pero accesible al server component.
export const RECENT_BOOKINGS_COOKIE = 'recent_bookings';
export const RECENT_BOOKINGS_MAX = 20;
export const RECENT_BOOKINGS_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export function parseRecentBookings(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function appendRecentBooking(raw: string | undefined | null, id: string): string {
  const list = parseRecentBookings(raw);
  const next = [id, ...list.filter((x) => x !== id)].slice(0, RECENT_BOOKINGS_MAX);
  return next.join(',');
}
