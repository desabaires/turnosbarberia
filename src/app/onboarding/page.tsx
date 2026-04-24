import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/client/OnboardingWizard';
import { MobileShell } from '@/components/shared/MobileShell';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, shop_id')
    .eq('id', user.id)
    .maybeSingle<{ name: string | null; shop_id: string | null }>();

  if (profile?.shop_id) redirect('/shop');

  return <MobileShell><OnboardingWizard userName={profile?.name || ''} /></MobileShell>;
}
