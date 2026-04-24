import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Whitelist de paths permitidos como destino post-login.
// Cualquier otra cosa (protocolo, //dominio, /\dominio, /%2Fdominio, etc.)
// se rechaza y se cae al default "/".
const SAFE_NEXT_RE = /^\/(shop(?:\/.*)?|onboarding|s\/[a-z0-9][a-z0-9-]{1,40}[a-z0-9](?:\/.*)?|registro|login|perfil)?$/;

function sanitizeNext(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  if (raw.includes('\\')) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('//') || decoded.includes('\\')) return '/';
  } catch {
    return '/';
  }
  return SAFE_NEXT_RE.test(raw) ? raw : '/';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const safeNext = sanitizeNext(searchParams.get('next'));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
