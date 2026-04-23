import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';

export function ShopHeader({ subtitle, title, action }: { subtitle: string; title: string; action?: 'search' | 'plus' | 'more' }) {
  const actionLabels: Record<string, string> = {
    search: 'Buscar',
    plus: 'Nuevo',
    more: 'Más opciones'
  };
  return (
    <header className="px-5 pt-3 pb-3 flex items-center gap-3">
      <Link
        href="/shop"
        aria-label="Ir al dashboard"
        className="w-10 h-10 rounded-m grid place-items-center text-white font-display text-xl bg-accent active:scale-95 transition">
        E
      </Link>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-dark-muted uppercase tracking-[2px] font-mono">{subtitle}</div>
        <div className="text-[15px] font-semibold text-bg truncate">{title}</div>
      </div>
      {action && (
        <button
          type="button"
          className="w-10 h-10 rounded-m bg-dark-card border border-dark-line grid place-items-center text-bg active:scale-95 transition"
          aria-label={actionLabels[action] || 'Acción'}>
          <Icon name={action} size={16}/>
        </button>
      )}
    </header>
  );
}

export function ShopTabs({ active }: { active: 'agenda' | 'caja' | 'equipo' }) {
  const tabs = [
    { id: 'agenda', l: 'Agenda', href: '/shop' },
    { id: 'caja',   l: 'Caja',   href: '/shop/caja' },
    { id: 'equipo', l: 'Equipo', href: '/shop/equipo' }
  ] as const;
  return (
    <nav aria-label="Secciones del panel" className="px-5 pb-2 flex gap-4 border-b border-dark-line">
      {tabs.map(t => {
        const a = active === t.id;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={a ? 'page' : undefined}
            className={`py-2.5 text-[13px] -mb-px min-h-[44px] flex items-center transition ${a ? 'font-semibold text-bg border-b-2 border-accent' : 'font-normal text-dark-muted border-b-2 border-transparent hover:text-bg/80'}`}
          >
            {t.l}
          </Link>
        );
      })}
    </nav>
  );
}
