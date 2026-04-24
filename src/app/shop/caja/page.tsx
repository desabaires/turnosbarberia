import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminShop } from '@/lib/shop-context';
import { ShopHeader, ShopTabs } from '@/components/shop/ShopHeader';
import { CashView } from '@/components/shop/CashView';

export const dynamic = 'force-dynamic';

export default async function ShopCashPage() {
  const shop = await getAdminShop();
  if (!shop) redirect('/login?error=no_shop');

  const supabase = createClient();
  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(end.getDate() + 1);

  const [{ data: sales }, { data: products }] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .eq('shop_id', shop.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('shop_id', shop.id).eq('is_active', true).order('name')
  ]);

  return (
    <main className="flex-1 flex flex-col mx-auto w-full max-w-[440px] md:max-w-none md:mx-0">
      <ShopHeader subtitle="Caja del día"
        title={new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'short' }).replace('.','')}
        action="more"/>
      <ShopTabs active="caja"/>
      <CashView sales={(sales as any) || []} products={products || []}/>
    </main>
  );
}
