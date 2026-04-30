'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
import { Toast } from '@/components/shared/Toast';
import { establishPassword } from '@/app/actions/auth';

export function EstablecerPasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string } | null>(null);

  return (
    <main className="min-h-screen bg-ink text-bg relative overflow-hidden">
      <div className="absolute -top-[120px] -right-[80px] w-[360px] h-[360px] rounded-full border border-dark-line" aria-hidden="true" />
      <div className="absolute -top-[60px] -right-[20px] w-[240px] h-[240px] rounded-full border border-dark-line" aria-hidden="true" />

      <div className="relative flex flex-col px-6 pt-6 pb-8 min-h-screen">
        <div className="mt-7 relative">
          <div className="font-mono text-[10px] tracking-[3px] text-dark-muted mb-2.5">PASO 1 DE 2 · CUENTA</div>
          <h1 className="font-display text-[44px] leading-[0.98] -tracking-[1px]">Establecé tu<br/><span className="italic text-accent">contraseña.</span></h1>
          <div className="mt-3 text-[13px] text-dark-muted max-w-[300px]">
            Es la primera vez que entrás. Elegí una contraseña de mínimo 8 caracteres para volver a entrar la próxima.
          </div>
        </div>

        <form
          className="mt-6 flex flex-col gap-3"
          action={(fd) => start(async () => {
            setMsg(null);
            const res = await establishPassword(fd);
            if (res?.error) {
              setMsg({ text: res.error });
              return;
            }
            router.replace('/onboarding');
            router.refresh();
          })}
        >
          <label className="bg-dark-card rounded-xl px-4 py-3 border border-dark-line block focus-within:border-accent transition">
            <span className="block text-[10px] text-dark-muted uppercase tracking-[1.5px] mb-1">Nueva contraseña</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              enterKeyHint="next"
              placeholder="Mínimo 8 caracteres"
              className="bg-transparent text-bg text-[16px] w-full outline-none font-mono placeholder:text-dark-muted/60"
            />
          </label>
          <label className="bg-dark-card rounded-xl px-4 py-3 border border-dark-line block focus-within:border-accent transition">
            <span className="block text-[10px] text-dark-muted uppercase tracking-[1.5px] mb-1">Repetir contraseña</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              enterKeyHint="send"
              placeholder="Mínimo 8 caracteres"
              className="bg-transparent text-bg text-[16px] w-full outline-none font-mono placeholder:text-dark-muted/60"
            />
          </label>

          {msg && (
            <Toast
              dark
              tone="error"
              message={msg.text}
              onClose={() => setMsg(null)}
              autoDismissMs={5000}
            />
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-white border-0 px-4 py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 tracking-wide disabled:opacity-60 active:scale-[0.98] transition"
          >
            {pending ? 'Guardando…' : (<>Establecer y seguir <Icon name="arrow-right" size={18} color="#fff"/></>)}
          </button>
        </form>
      </div>
    </main>
  );
}
