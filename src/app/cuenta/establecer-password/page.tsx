import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EstablecerPasswordForm } from '@/components/client/EstablecerPasswordForm';
import { MobileShell } from '@/components/shared/MobileShell';

export const dynamic = 'force-dynamic';

// Pantalla de "establecer tu primera contraseña" — la usamos justo después
// del magic link de signup del dueño. La sesión la creó `auth/callback`
// con exchangeCodeForSession; si entran sin sesión (link viejo), pedimos
// que arranquen el registro de nuevo.
export default async function EstablecerPasswordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/registro?role=duenio&expired=1');

  return <MobileShell><EstablecerPasswordForm /></MobileShell>;
}
