'use client';
import { useEffect } from 'react';
import { Icon } from './Icon';

type Tone = 'error' | 'success' | 'info';

export function Toast({
  message, tone = 'error', onClose, dark = false, autoDismissMs = 4500
}: {
  message: string;
  tone?: Tone;
  onClose?: () => void;
  dark?: boolean;
  autoDismissMs?: number | null;
}) {
  useEffect(() => {
    if (!autoDismissMs || !onClose) return;
    const id = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(id);
  }, [autoDismissMs, onClose]);

  const palette = {
    error:   { bg: 'rgba(182,117,76,.16)', bd: 'rgba(182,117,76,.40)', fg: '#B6754C' },
    success: { bg: dark ? 'rgba(245,243,238,.08)' : 'rgba(14,14,14,.06)', bd: dark ? 'rgba(245,243,238,.18)' : 'rgba(14,14,14,.14)', fg: dark ? '#F5F3EE' : '#0E0E0E' },
    info:    { bg: dark ? 'rgba(245,243,238,.06)' : 'rgba(14,14,14,.04)', bd: dark ? '#2A2824' : '#E3DFD6', fg: dark ? '#F5F3EE' : '#0E0E0E' }
  }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in rounded-xl px-3 py-2.5 flex items-start gap-2.5 text-[13px] leading-snug"
      style={{ background: palette.bg, border: `1px solid ${palette.bd}`, color: palette.fg }}
    >
      <div className="flex-1 min-w-0">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="-mr-1 -my-1 p-1 opacity-70 hover:opacity-100 active:scale-95 transition"
        >
          <Icon name="close" size={14} color={palette.fg}/>
        </button>
      )}
    </div>
  );
}
