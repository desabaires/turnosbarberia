import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { LAST_SHOP_COOKIE } from '@/lib/shop-context';

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  try {
    response = await updateSession(request);
  } catch (err) {
    // Never let session refresh fail the entire request.
    console.error('[middleware] updateSession failed', err);
    response = NextResponse.next({ request });
  }

  // Track last-visited shop for the root redirect.
  // Solo seteamos si el slug matchea el shape esperado (evita que un path
  // con caracteres raros quede pegado como cookie forever).
  const match = request.nextUrl.pathname.match(/^\/s\/([^/]+)(?:\/|$)/);
  if (match) {
    const slug = match[1];
    const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$/;
    if (SLUG_RE.test(slug) && request.cookies.get(LAST_SHOP_COOKIE)?.value !== slug) {
      response.cookies.set(LAST_SHOP_COOKIE, slug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax'
      });
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
