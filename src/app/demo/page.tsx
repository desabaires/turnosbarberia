import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { MobileShell } from '@/components/shared/MobileShell';
import { DemoSubmitButton } from '@/components/client/DemoButton';
import { enterDemoCliente, enterDemoDueno } from '@/app/actions/demo';

export const dynamic = 'force-dynamic';

// No redirigimos si hay sesión: el server action `enterDemo` rota entre
// cuentas demo (cliente↔dueño) sin problema — si el user ya está logueado
// y hace click, queda con la otra cuenta.
export default function DemoPage({ searchParams }: { searchParams: { err?: string } }) {
  const errorMessage = searchParams?.err ? decodeURIComponent(searchParams.err) : null;

  return (
    <MobileShell>
      <main className="min-h-screen bg-ink text-bg relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[80px] w-[360px] h-[360px] rounded-full border border-dark-line" aria-hidden="true" />
        <div className="absolute -top-[60px] -right-[20px] w-[240px] h-[240px] rounded-full border border-dark-line" aria-hidden="true" />

        <div className="relative flex flex-col px-6 pt-6 pb-8 min-h-screen">
          <div className="mt-10">
            <div className="font-mono text-[10px] tracking-[3px] text-dark-muted mb-2.5">DEMO · SIN REGISTRO</div>
            <h1 className="font-display text-[56px] leading-[0.95] -tracking-[1px]">
              Probá<br/>la <span className="italic text-accent">demo</span>
            </h1>
            <div className="mt-3 text-[14px] text-dark-muted max-w-[300px]">
              Elegí cómo querés verla.
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <form action={enterDemoCliente}>
              <DemoSubmitButton label="Cliente" iconName="user" variant="light" />
            </form>
            <form action={enterDemoDueno}>
              <DemoSubmitButton label="Dueño" iconName="settings" variant="dark" />
            </form>
          </div>

          <div className="mt-4 text-[11px] text-dark-muted leading-relaxed">
            <div><span className="text-bg font-semibold">Cliente:</span> home, reservar, mis turnos.</div>
            <div className="mt-1"><span className="text-bg font-semibold">Dueño:</span> agenda del día, caja, equipo.</div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[12px] text-bg">
              {errorMessage}
            </div>
          )}

          <div className="flex-1 min-h-[16px]" />

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] text-dark-muted underline underline-offset-4 hover:text-bg transition text-center"
            >
              ¿Sos dueño y ya te registraste? Entrá con tu email <Icon name="arrow-right" size={12} color="#8C8A83" />
            </Link>
            <Link
              href="/"
              className="text-[11px] text-dark-muted hover:text-bg transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </MobileShell>
  );
}
