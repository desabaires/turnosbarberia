import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { LAST_SHOP_COOKIE } from '@/lib/shop-context';

// Paths reservados del top-level: URLs que NO son shop slugs. El middleware
// solo setea `last_shop` cuando el primer segmento no es uno de estos.
// Mantenemos también los legacy (`s`, `desa`) por si quedan cookies/links viejos
// apuntando ahí — evita que un visitante queme la cookie con basura.
const RESERVED_PATHS = new Set([
  'api', 'auth', '_next', 'favicon.ico',
  'shop', 'login', 'registro', 'demo', 'desarrollo',
  'onboarding', 'admin',
  // legacy
  's', 'desa'
]);

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$/;

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  try {
    response = await updateSession(request);
  } catch (err) {
    // Never let session refresh fail the entire request.
    console.error('[middleware] updateSession failed', err);
    response = NextResponse.next({ request });
  }

  // Track last-visited shop para el root redirect.
  // Solo seteamos si el primer segmento no es una ruta reservada y matchea
  // el shape de un slug válido (evita que paths raros queden como cookie).
  const match = request.nextUrl.pathname.match(/^\/([^/]+)(?:\/|$)/);
  if (match) {
    const first = match[1];
    if (!RESERVED_PATHS.has(first) && SLUG_RE.test(first)) {
      if (request.cookies.get(LAST_SHOP_COOKIE)?.value !== first) {
        response.cookies.set(LAST_SHOP_COOKIE, first, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax'
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all pages except static assets, images, _next internals.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'
  ]
};
