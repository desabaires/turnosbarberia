'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';

const tabs = [
  { id: 'agenda',    icon: 'calendar', label: 'Agenda',    href: '/shop' },
  { id: 'dashboard', icon: 'star',     label: 'Stats',     href: '/shop/dashboard' },
  { id: 'add',       icon: 'plus',     label: 'Nuevo',     href: '/shop/nuevo' },
  { id: 'caja',      icon: 'cash',     label: 'Caja',      href: '/shop/caja' },
  { id: 'more',      icon: 'settings', label: 'Ajustes',   href: '/shop/ajustes' }
] as const;

export function ShopTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="border-t border-dark-line bg-dark-card flex justify-around px-3 pt-2 pb-6">
      {tabs.map(t => {
        const isActive =
          t.href === '/shop' ? pathname === '/shop' :
          pathname.startsWith(t.href);
        const isCta = t.id === 'add';
        if (isCta) {
          return (
            <Link key={t.id} href={t.href}
              aria-label="Nuevo turno"
              className="-mt-2 grid h-12 w-12 place-items-center rounded-full bg-accent text-white shadow-fab-dark active:scale-95 transition">
              <Icon name={t.icon} size={22} color="#fff"/>
            </Link>
          );
        }
        return (
          <Link key={t.id} href={t.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={t.label}
            className={`flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[48px] px-1 py-1 transition ${isActive ? 'text-bg' : 'text-dark-muted'}`}>
            <Icon name={t.icon} size={20}/>
            <span className={`text-[10px] ${isActive ? 'font-semibold' : ''}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
