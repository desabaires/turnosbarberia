import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/client/LoginForm';
import { MobileShell } from '@/components/shared/MobileShell';

export const dynamic = 'force-dynamic';

// /login ahora es SOLO magic link para dueños con cuenta. Los flujos de demo
// viven en /demo. Si el user ya tiene sesión, lo mandamos a su panel (admin)
// o a la landing (no-admin).
export default async function LoginPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    redirect((profile as any)?.is_admin ? '/shop' : '/');
  }
  return <MobileShell><LoginForm /></MobileShell>;
}
