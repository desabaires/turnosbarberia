'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
import { PRODUCT } from '@/lib/shop-info';

const items = [
  { id: 'agenda', icon: 'calendar', label: 'Agenda',  href: '/shop' },
  { id: 'caja',   icon: 'cash',     label: 'Caja',    href: '/shop/caja' },
  { id: 'team',   icon: 'users',    label: 'Equipo',  href: '/shop/equipo' },
  { id: 'more',   icon: 'settings', label: 'Ajustes', href: '/shop/ajustes' }
] as const;

export function ShopSidebar({ shop }: { shop: { name: string; slug: string } }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-dark text-bg">
      <div className="px-5 pt-6 pb-5 border-b border-dark-line">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-m grid place-items-center bg-accent text-white">
            <Icon name="scissors" size={18} color="#fff"/>
          </div>
          <div className="min-w-0">
            <div className="font-display text-[18px] leading-none text-bg truncate">{PRODUCT.name}</div>
            <div className="font-mono text-[9px] tracking-[2px] text-dark-muted mt-1">PANEL ADMIN</div>
          </div>
        </div>
      </div>

      <nav aria-label="Navegación del panel" className="flex-1 px-3 py-4 flex flex-col gap-1">
        {items.map(it => {
          const isActive =
            it.href === '/shop' ? pathname === '/shop' :
            pathname.startsWith(it.href);
          return (
            <Link key={it.id} href={it.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-m text-[14px] transition
                ${isActive
                  ? 'bg-bg text-ink font-semibold'
                  : 'text-bg/85 hover:bg-dark-card hover:text-bg font-medium'}`}>
              <Icon name={it.icon} size={18}/>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-dark-line space-y-3">
        <div>
          <div className="font-mono text-[9px] tracking-[2px] text-dark-muted">TU BARBERÍA</div>
          <div className="text-[13px] font-semibold text-bg mt-1 truncate">{shop.name}</div>
        </div>
        <a
          href={`/s/${shop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-m bg-dark-card border border-dark-line text-bg text-[12px] font-medium hover:border-bg/30 transition">
          <span>Ver como cliente</span>
          <Icon name="arrow-right" size={14}/>
        </a>
      </div>
    </div>
  );
}
