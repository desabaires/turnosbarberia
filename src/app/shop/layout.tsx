import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminShop } from '@/lib/shop-context';
import { ShopSidebar } from '@/components/shop/ShopSidebar';
import { ShopTabBar } from '@/components/shop/ShopTabBar';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/shop');

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) redirect('/');

  const shop = await getAdminShop();
  if (!shop) redirect('/login?error=no_shop');

  return (
    <div className="min-h-screen bg-dark text-bg md:flex">
      <aside className="hidden md:block md:w-64 lg:w-72 md:shrink-0 md:border-r md:border-dark-line md:sticky md:top-0 md:h-screen">
        <ShopSidebar shop={{ name: shop.name, slug: shop.slug }}/>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <div className="md:hidden">
          <ShopTabBar/>
        </div>
      </div>
    </div>
  );
}
