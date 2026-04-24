'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Icon } from '@/components/shared/Icon';
import { switchShop } from '@/app/actions/ajustes';

export type ShopBrief = { id: string; name: string; slug: string; plan?: string };

/**
 * Selector de sede reusable. Nacío dentro del `ShopSidebar`, lo extrajimos
 * para poder reutilizarlo desde el header mobile de la agenda cuando el user
 * tiene más de una sede.
 */
export function ShopSwitcher({
  shop, userShops, compact = false
}: {
  shop: ShopBrief;
  userShops: ShopBrief[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const pick = (id: string) => {
    if (id === shop.id) { setOpen(false); return; }
    start(async () => {
      const r = await switchShop(id);
      setOpen(false);
      if (!r?.error) router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        className={`w-full flex items-center gap-2 rounded-m bg-dark-card border border-dark-line text-bg font-medium hover:border-bg/30 transition disabled:opacity-60 ${compact ? 'px-3 py-2 text-[12px]' : 'px-3 py-2 text-[12px]'}`}>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-mono text-[9px] tracking-[2px] text-dark-muted">SEDE ACTUAL</div>
          <div className="truncate mt-0.5 text-[13px]">{shop.name}</div>
        </div>
        <Icon name="chevron-down" size={14}/>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"/>
          <ul
            role="listbox"
            className="absolute left-0 right-0 mt-1 z-20 bg-dark-card border border-dark-line rounded-m overflow-hidden shadow-fab-dark">
            {userShops.map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.id === shop.id}
                  onClick={() => pick(s.id)}
                  disabled={pending}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] transition
                    ${s.id === shop.id
                      ? 'bg-bg text-ink font-semibold'
                      : 'text-bg hover:bg-dark'} disabled:opacity-60`}>
                  <span className="flex-1 min-w-0 truncate">{s.name}</span>
                  {s.id === shop.id && <Icon name="check" size={14}/>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
