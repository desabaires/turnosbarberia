'use client';
import { useState } from 'react';
import { Icon } from '@/components/shared/Icon';

export function ChangeAvatarButton() {
  const [busy, setBusy] = useState(false);
  const onClick = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 900);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-[11px] text-muted underline py-2 px-1 active:opacity-60 transition disabled:opacity-40"
    >
      {busy ? 'Próximamente…' : 'Cambiar avatar'}
    </button>
  );
}

export function EmailNotifsToggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Recibir notificaciones por email"
      onClick={() => setOn(v => !v)}
      className="w-full bg-card border border-line rounded-xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition"
    >
      <div className="w-8 h-8 rounded-m bg-bg grid place-items-center">
        <Icon name="mail" size={16}/>
      </div>
      <div className="flex-1 text-left">
        <div className="text-[14px] font-medium">Notificaciones por email</div>
        <div className="text-[11px] text-muted mt-0.5">Confirmaciones, recordatorios y cambios</div>
      </div>
      <span
        className={`relative inline-block w-[38px] h-[22px] rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line'}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-[16px]' : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
}
