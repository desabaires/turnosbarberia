import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/client/LoginForm';
import { MobileShell } from '@/components/shared/MobileShell';

export const dynamic = 'force-dynamic';

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
