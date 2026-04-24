import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminShop } from '@/lib/shop-context';
import { ShopHeader, ShopTabs } from '@/components/shop/ShopHeader';
import { AgendaView } from '@/components/shop/AgendaView';
import { AgendaSummary } from '@/components/shop/AgendaSummary';

export const dynamic = 'force-dynamic';

export default async function ShopAgendaPage({ searchParams }: { searchParams: { d?: string } }) {
  const shop = await getAdminShop();
  if (!shop) redirect('/login?error=no_shop');

  const supabase = createClient();
  const dayISO = searchParams.d || todayISO();
  const start = new Date(dayISO + 'T00:00:00-03:00');
  const end   = new Date(start.getTime() + 86400000);

  const [{ data: appts }, { data: barbers }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, ends_at, customer_name, status, services(name, duration_mins, price), barbers(id, name, initials, hue)')
      .eq('shop_id', shop.id)
      .gte('starts_at', start.toISOString())
      .lt('starts_at', end.toISOString())
      .neq('status', 'cancelled')
      .order('starts_at'),
    supabase.from('barbers').select('*').eq('shop_id', shop.id).eq('is_active', true)
  ]);

  const appointments = (appts as any) || [];

  return (
    <div className="flex-1 flex">
      <main className="flex-1 flex flex-col min-w-0 mx-auto w-full max-w-[440px] md:max-w-none md:mx-0">
        <ShopHeader subtitle="Dashboard" title={shop.name} action="search"/>
        <ShopTabs active="agenda"/>
        <AgendaView appointments={appointments} barbers={barbers || []} dayISO={dayISO}/>
      </main>
      <AgendaSummary appointments={appointments} dayISO={dayISO}/>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
