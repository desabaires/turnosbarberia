'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/Icon';

type ItemId = 'shared' | 'walkin' | 'cash';

const ITEMS: Array<{ id: ItemId; title: string; description: string }> = [
  { id: 'shared',  title: 'Compartí tu link público',     description: 'Avisale a tus clientes que pueden reservar online.' },
  { id: 'walkin',  title: 'Sumá tu primer walk-in',       description: 'Cargá un turno manual para probar la agenda.' },
  { id: 'cash',    title: 'Revisá la caja del día',       description: 'Configurá cobros y productos antes del primer turno.' }
];

export function ShopActivationChecklist({ shopName, slug }: { shopName: string; slug: string }) {
  const storageKey = `onboarding_done_${slug}`;
  const [done, setDone] = useState<Record<ItemId, boolean>>({ shared: false, walkin: false, cash: false });
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<ItemId, boolean>>;
        setDone({
          shared: !!parsed.shared,
          walkin: !!parsed.walkin,
          cash: !!parsed.cash
        });
      }
    } catch { /* corrupt data, ignore */ }
    setHydrated(true);
  }, [storageKey]);

  const persist = (next: Record<ItemId, boolean>) => {
    setDone(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
  };

  const toggle = (id: ItemId) => persist({ ...done, [id]: !done[id] });

  const publicUrl = (() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/s/${slug}`;
    }
    return `/s/${slug}`;
  })();

  const shareText = `Reservá tu turno en ${shopName}: ${publicUrl}`;

  const copy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(publicUrl);
      }
    } catch { /* clipboard can fail silently */ }
    if (!done.shared) persist({ ...done, shared: true });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const allDone = done.shared && done.walkin && done.cash;

  return (
    <div className="flex-1 overflow-auto px-5 md:px-8 pt-4 pb-8">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[2px] bg-accent text-white">
          {allDone ? 'TODO LISTO' : 'BARBERÍA LISTA'}
        </span>
        <span className="text-[11px] text-dark-muted">
          {allDone ? 'Configurada. Empezá a sumar turnos.' : 'Compartí tu link y sumá el primer turno.'}
        </span>
      </div>

      {/* Big public link CTA */}
      <div className="bg-dark-card border border-dark-line rounded-2xl px-4 py-4">
        <div className="font-mono text-[10px] tracking-[2px] text-dark-muted">TU LINK PÚBLICO</div>
        <div className="font-mono text-[13px] text-bg mt-1 break-all">{publicUrl}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="bg-accent text-white px-4 py-2.5 rounded-m text-[13px] font-semibold flex items-center gap-2 active:scale-[0.98] transition">
            <Icon name="check" size={14} color="#fff"/>
            {copied ? '¡Copiado!' : 'Copiar link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => { if (!done.shared) persist({ ...done, shared: true }); }}
            className="bg-bg text-ink px-4 py-2.5 rounded-m text-[13px] font-semibold active:scale-[0.98] transition">
            WhatsApp
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noreferrer"
            onClick={() => { if (!done.shared) persist({ ...done, shared: true }); }}
            className="bg-transparent text-bg border border-dark-line px-4 py-2.5 rounded-m text-[13px] font-semibold active:scale-[0.98] transition">
            Instagram Story
          </a>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-5 font-mono text-[10px] tracking-[2px] text-dark-muted">PRIMEROS PASOS</div>
      <ul className="mt-2 flex flex-col gap-2">
        <ChecklistRow
          done={done.shared}
          onToggle={() => toggle('shared')}
          title={ITEMS[0].title}
          description={ITEMS[0].description}
          action={
            <button
              type="button"
              onClick={copy}
              className="text-[11px] text-accent underline underline-offset-4 py-2 px-1">
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          }
        />
        <ChecklistRow
          done={done.walkin}
          onToggle={() => toggle('walkin')}
          title={ITEMS[1].title}
          description={ITEMS[1].description}
          action={
            <Link
              href="/shop/nuevo"
              onClick={() => { if (!done.walkin) persist({ ...done, walkin: true }); }}
              className="text-[11px] text-accent underline underline-offset-4 py-2 px-1">
              Sumar
            </Link>
          }
        />
        <ChecklistRow
          done={done.cash}
          onToggle={() => toggle('cash')}
          title={ITEMS[2].title}
          description={ITEMS[2].description}
          action={
            <Link
              href="/shop/caja"
              onClick={() => { if (!done.cash) persist({ ...done, cash: true }); }}
              className="text-[11px] text-accent underline underline-offset-4 py-2 px-1">
              Abrir
            </Link>
          }
        />
      </ul>

      {hydrated && allDone && (
        <div className="mt-5 bg-dark-card border border-accent/50 rounded-xl px-4 py-3 text-[12px] text-bg">
          Todo listo. Cuando entren turnos o ventas vas a ver acá la agenda del día.
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  done, onToggle, title, description, action
}: {
  done: boolean;
  onToggle: () => void;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <li className="bg-dark-card border border-dark-line rounded-xl px-3.5 py-3 flex items-start gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Marcar "${title}" como pendiente` : `Marcar "${title}" como hecho`}
        className={`mt-0.5 w-5 h-5 rounded-[5px] border flex-shrink-0 grid place-items-center transition
          ${done ? 'bg-accent border-accent' : 'border-dark-line bg-transparent'}`}
      >
        {done && <Icon name="check" size={12} color="#fff"/>}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-semibold ${done ? 'text-dark-muted line-through' : 'text-bg'}`}>{title}</div>
        <div className="text-[11px] text-dark-muted mt-0.5">{description}</div>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </li>
  );
}
