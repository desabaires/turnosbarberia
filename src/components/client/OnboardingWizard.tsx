'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
import { Toast } from '@/components/shared/Toast';
import { slugify } from '@/lib/slug';
import { checkSlugAvailable, createShop, type DaySchedule } from '@/app/actions/onboarding';

type ServiceDraft = { name: string; duration_mins: number; price: number };
type BarberDraft = { name: string; role: string };

const DAYS = [
  { idx: 1, short: 'Lun', long: 'Lunes' },
  { idx: 2, short: 'Mar', long: 'Martes' },
  { idx: 3, short: 'Mié', long: 'Miércoles' },
  { idx: 4, short: 'Jue', long: 'Jueves' },
  { idx: 5, short: 'Vie', long: 'Viernes' },
  { idx: 6, short: 'Sáb', long: 'Sábado' },
  { idx: 0, short: 'Dom', long: 'Domingo' }
];

const DEFAULT_SCHED: DaySchedule[] = DAYS.map(d => ({
  day_of_week: d.idx,
  start_time: '10:00',
  end_time: '20:00',
  is_working: d.idx !== 0
}));

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

export function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [slugState, setSlugState] = useState<{ checking: boolean; available: boolean | null; reason?: string }>({ checking: false, available: null });

  useEffect(() => {
    if (!slugTouched) setShopSlug(slugify(shopName));
  }, [shopName, slugTouched]);

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    if (!shopSlug) { setSlugState({ checking: false, available: null }); return; }
    setSlugState(s => ({ ...s, checking: true }));
    slugDebounceRef.current = setTimeout(async () => {
      const res = await checkSlugAvailable(shopSlug);
      setSlugState({ checking: false, available: res.available, reason: res.reason });
    }, 400);
    return () => { if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current); };
  }, [shopSlug]);

  const [services, setServices] = useState<ServiceDraft[]>([
    { name: 'Corte de pelo',    duration_mins: 30, price: 8500 },
    { name: 'Corte + Barba',    duration_mins: 50, price: 12500 },
    { name: 'Arreglo de barba', duration_mins: 20, price: 5500 }
  ]);

  const [barbers, setBarbers] = useState<BarberDraft[]>([
    { name: userName || 'Yo', role: 'Dueño' }
  ]);

  const [perBarber, setPerBarber] = useState(false);
  const [generalSched, setGeneralSched] = useState<DaySchedule[]>(DEFAULT_SCHED);
  const [barberSched, setBarberSched] = useState<Record<string, DaySchedule[]>>({});

  useEffect(() => {
    setBarberSched(prev => {
      const next: Record<string, DaySchedule[]> = {};
      for (let i = 0; i < barbers.length; i++) {
        next[String(i)] = prev[String(i)] || DEFAULT_SCHED.map(d => ({ ...d }));
      }
      return next;
    });
  }, [barbers.length]);

  const step1Valid = useMemo(() => {
    return shopName.trim().length >= 2 && shopSlug.length >= 3 && slugState.available === true;
  }, [shopName, shopSlug, slugState.available]);

  const step2Valid = useMemo(() => {
    return services.length > 0 && services.every(s => s.name.trim().length > 0 && s.duration_mins > 0 && s.price >= 0);
  }, [services]);

  const step3Valid = useMemo(() => {
    return barbers.length > 0 && barbers.every(b => b.name.trim().length > 0);
  }, [barbers]);

  const step4Valid = useMemo(() => {
    const sched = perBarber ? Object.values(barberSched).flat() : generalSched;
    return sched.length > 0 && sched.some(d => d.is_working);
  }, [perBarber, generalSched, barberSched]);

  const canNext = (
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid)
  );

  const submit = () => start(async () => {
    setMsg(null);
    const res = await createShop({
      shop: {
        name: shopName.trim(),
        slug: shopSlug.trim(),
        address: shopAddress.trim() || undefined,
        phone: shopPhone.trim() || undefined
      },
      services: services.map(s => ({ name: s.name.trim(), duration_mins: s.duration_mins, price: s.price })),
      barbers: barbers.map(b => ({ name: b.name.trim(), role: b.role.trim() || undefined })),
      schedules: {
        perBarber,
        general: perBarber ? undefined : generalSched,
        byBarber: perBarber ? barberSched : undefined
      }
    });
    if (res?.error) { setMsg({ text: res.error }); return; }
    setMsg({ ok: true, text: '¡Listo! Redirigiendo a tu panel…' });
    router.push('/shop');
    router.refresh();
  });

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[2px] text-muted">SETUP · {step}/4</div>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-[11px] text-muted underline underline-offset-4">
            Salir
          </button>
        </div>
        <h1 className="mt-2 font-display text-[30px] leading-[1.05] -tracking-[0.5px]">
          {step === 1 && (<>Tu <span className="italic text-accent">barbería</span></>)}
          {step === 2 && (<>¿Qué <span className="italic text-accent">servicios</span> ofrecés?</>)}
          {step === 3 && (<>Tu <span className="italic text-accent">equipo</span></>)}
          {step === 4 && (<>Horarios de <span className="italic text-accent">atención</span></>)}
        </h1>
        <div className="mt-3 flex gap-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
          {[1, 2, 3, 4].map(i => (
            <div key={i}
              className={`flex-1 h-[3px] rounded transition-colors duration-200 ${i <= step ? 'bg-ink' : 'bg-line'}`}/>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-4">
        {step === 1 && (
          <Step1
            name={shopName} onName={setShopName}
            slug={shopSlug}
            onSlug={(s) => { setSlugTouched(true); setShopSlug(slugify(s)); }}
            slugState={slugState}
            address={shopAddress} onAddress={setShopAddress}
            phone={shopPhone} onPhone={setShopPhone}
          />
        )}
        {step === 2 && (
          <Step2 services={services} onChange={setServices}/>
        )}
        {step === 3 && (
          <Step3 barbers={barbers} onChange={setBarbers}/>
        )}
        {step === 4 && (
          <Step4
            perBarber={perBarber}
            onPerBarber={setPerBarber}
            general={generalSched}
            onGeneral={setGeneralSched}
            byBarber={barberSched}
            onByBarber={setBarberSched}
            barbers={barbers}
          />
        )}

        {msg && (
          <div className="mt-4">
            <Toast
              tone={msg.ok ? 'success' : 'error'}
              message={msg.text}
              onClose={() => setMsg(null)}
              autoDismissMs={msg.ok ? 6000 : 6000}
            />
          </div>
        )}
      </div>

      <footer className="border-t border-line bg-card px-5 pt-3.5 pb-7 flex items-center gap-3">
        {step > 1 ? (
          <button type="button"
            onClick={() => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4))}
            className="bg-card border border-line px-4 py-3 rounded-xl text-[13px] font-medium flex items-center gap-2 active:scale-[0.97] transition">
            <Icon name="arrow-left" size={16}/> Anterior
          </button>
        ) : <div/>}
        <div className="flex-1"/>
        {step < 4 ? (
          <button type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4))}
            className="bg-accent text-white px-6 py-3.5 rounded-xl text-[14px] font-semibold flex items-center gap-2 disabled:opacity-40 active:scale-[0.97] transition">
            Siguiente <Icon name="arrow-right" size={16} color="#fff"/>
          </button>
        ) : (
          <button type="button"
            disabled={!canNext || pending}
            onClick={submit}
            className="bg-accent text-white px-6 py-3.5 rounded-xl text-[14px] font-semibold flex items-center gap-2 disabled:opacity-50 active:scale-[0.97] transition">
            {pending ? 'Creando…' : (<>Crear barbería <Icon name="arrow-right" size={16} color="#fff"/></>)}
          </button>
        )}
      </footer>
    </main>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-mono text-[10px] tracking-[2px] text-muted mb-2.5 ${className}`}>{children}</div>;
}

function Step1({
  name, onName, slug, onSlug, slugState, address, onAddress, phone, onPhone
}: {
  name: string; onName: (v: string) => void;
  slug: string; onSlug: (v: string) => void;
  slugState: { checking: boolean; available: boolean | null; reason?: string };
  address: string; onAddress: (v: string) => void;
  phone: string; onPhone: (v: string) => void;
}) {
  const statusIcon = slugState.checking ? (
    <span className="text-[11px] text-muted font-mono">…</span>
  ) : slugState.available === true ? (
    <Icon name="check" size={16} color="#2E7D32"/>
  ) : slugState.available === false ? (
    <Icon name="close" size={16} color="#B6754C"/>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>NOMBRE</SectionLabel>
      <label className="bg-card border border-line rounded-xl px-4 py-2.5 block focus-within:border-ink/50 transition">
        <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Nombre de la barbería</span>
        <input
          value={name}
          onChange={e => onName(e.target.value)}
          placeholder="Estudio Barba Norte"
          autoComplete="off"
          className="bg-transparent text-ink w-full outline-none text-[16px]"
        />
      </label>

      <label className="bg-card border border-line rounded-xl px-4 py-2.5 block focus-within:border-ink/50 transition">
        <div className="flex items-center justify-between mb-0.5">
          <span className="block text-[10px] text-muted uppercase tracking-[1.5px]">Link público (slug)</span>
          <span className="w-4 h-4 grid place-items-center">{statusIcon}</span>
        </div>
        <input
          value={slug}
          onChange={e => onSlug(e.target.value)}
          placeholder="estudio-barba-norte"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="bg-transparent text-ink w-full outline-none font-mono text-[14px]"
        />
      </label>
      <div className="text-[11px] text-muted -mt-1">
        {slugState.available === false && slugState.reason ? (
          <span className="text-accent">{slugState.reason}</span>
        ) : (
          <>Preview: <span className="font-mono">turnosbarberia.vercel.app/s/{slug || '...'}</span></>
        )}
      </div>

      <SectionLabel className="mt-4">CONTACTO (OPCIONAL)</SectionLabel>
      <label className="bg-card border border-line rounded-xl px-4 py-2.5 block focus-within:border-ink/50 transition">
        <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Dirección</span>
        <input
          value={address}
          onChange={e => onAddress(e.target.value)}
          placeholder="Av. Santa Fe 3200, CABA"
          autoComplete="street-address"
          className="bg-transparent text-ink w-full outline-none text-[15px]"
        />
      </label>
      <label className="bg-card border border-line rounded-xl px-4 py-2.5 block focus-within:border-ink/50 transition">
        <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Teléfono</span>
        <input
          value={phone}
          onChange={e => onPhone(e.target.value)}
          placeholder="+54 9 11 5823 4412"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="bg-transparent text-ink w-full outline-none font-mono text-[14px]"
        />
      </label>
    </div>
  );
}

function Step2({
  services, onChange
}: { services: ServiceDraft[]; onChange: (s: ServiceDraft[]) => void }) {
  const update = (i: number, patch: Partial<ServiceDraft>) => {
    onChange(services.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };
  const remove = (i: number) => {
    if (services.length <= 1) return;
    onChange(services.filter((_, idx) => idx !== i));
  };
  const add = () => onChange([...services, { name: '', duration_mins: 30, price: 0 }]);

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>SERVICIOS (MÍNIMO 1)</SectionLabel>
      {services.map((s, i) => (
        <div key={i} className="bg-card border border-line rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="flex-1 block">
              <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Nombre</span>
              <input
                value={s.name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="Corte de pelo"
                className="bg-transparent text-ink w-full outline-none text-[15px]"
              />
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={services.length <= 1}
              aria-label="Eliminar servicio"
              className="w-9 h-9 rounded-m border border-line grid place-items-center active:scale-95 transition disabled:opacity-30">
              <Icon name="close" size={14}/>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block border border-line rounded-m px-3 py-2">
              <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Duración</span>
              <select
                value={s.duration_mins}
                onChange={e => update(i, { duration_mins: Number(e.target.value) })}
                className="bg-transparent text-ink w-full outline-none text-[14px] font-mono">
                {DURATION_OPTIONS.map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </label>
            <label className="block border border-line rounded-m px-3 py-2">
              <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Precio</span>
              <input
                value={s.price}
                onChange={e => update(i, { price: Math.max(0, Number(e.target.value) || 0) })}
                type="number"
                inputMode="numeric"
                min={0}
                className="bg-transparent text-ink w-full outline-none text-[14px] font-mono"
              />
            </label>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="mt-1 rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <Icon name="plus" size={16}/> Agregar servicio
      </button>
    </div>
  );
}

function Step3({
  barbers, onChange
}: { barbers: BarberDraft[]; onChange: (b: BarberDraft[]) => void }) {
  const update = (i: number, patch: Partial<BarberDraft>) => {
    onChange(barbers.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  };
  const remove = (i: number) => {
    if (barbers.length <= 1) return;
    onChange(barbers.filter((_, idx) => idx !== i));
  };
  const add = () => onChange([...barbers, { name: '', role: '' }]);

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>EQUIPO (MÍNIMO 1)</SectionLabel>
      {barbers.map((b, i) => (
        <div key={i} className="bg-card border border-line rounded-xl p-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-ink text-bg grid place-items-center text-[12px] font-semibold flex-shrink-0">
            {initials(b.name)}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="block">
              <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Nombre</span>
              <input
                value={b.name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="Tomás Aguirre"
                className="bg-transparent text-ink w-full outline-none text-[15px]"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] text-muted uppercase tracking-[1.5px] mb-0.5">Rol (opcional)</span>
              <input
                value={b.role}
                onChange={e => update(i, { role: e.target.value })}
                placeholder="Senior · 5 años"
                className="bg-transparent text-ink w-full outline-none text-[13px]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={barbers.length <= 1}
            aria-label="Eliminar barbero"
            className="w-9 h-9 rounded-m border border-line grid place-items-center active:scale-95 transition disabled:opacity-30 flex-shrink-0">
            <Icon name="close" size={14}/>
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="mt-1 rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <Icon name="plus" size={16}/> Agregar barbero
      </button>
    </div>
  );
}

function Step4({
  perBarber, onPerBarber, general, onGeneral, byBarber, onByBarber, barbers
}: {
  perBarber: boolean;
  onPerBarber: (v: boolean) => void;
  general: DaySchedule[];
  onGeneral: (s: DaySchedule[]) => void;
  byBarber: Record<string, DaySchedule[]>;
  onByBarber: (s: Record<string, DaySchedule[]>) => void;
  barbers: BarberDraft[];
}) {
  const [selectedBarber, setSelectedBarber] = useState<number>(0);

  useEffect(() => {
    if (selectedBarber >= barbers.length) setSelectedBarber(0);
  }, [barbers.length, selectedBarber]);

  const updateGeneral = (dayIdx: number, patch: Partial<DaySchedule>) => {
    onGeneral(general.map(d => d.day_of_week === dayIdx ? { ...d, ...patch } : d));
  };

  const updateBarber = (bIdx: number, dayIdx: number, patch: Partial<DaySchedule>) => {
    const cur = byBarber[String(bIdx)] || DEFAULT_SCHED.map(d => ({ ...d }));
    const next = cur.map(d => d.day_of_week === dayIdx ? { ...d, ...patch } : d);
    onByBarber({ ...byBarber, [String(bIdx)]: next });
  };

  const currentSched = perBarber
    ? (byBarber[String(selectedBarber)] || DEFAULT_SCHED.map(d => ({ ...d })))
    : general;

  const onPatch = (dayIdx: number, patch: Partial<DaySchedule>) => {
    if (perBarber) updateBarber(selectedBarber, dayIdx, patch);
    else updateGeneral(dayIdx, patch);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="bg-card border border-line rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer select-none">
        <span
          role="switch"
          aria-checked={!perBarber}
          tabIndex={0}
          onClick={() => onPerBarber(!perBarber ? true : false)}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onPerBarber(!perBarber); } }}
          className={`w-10 h-6 rounded-full transition flex-shrink-0 ${!perBarber ? 'bg-accent' : 'bg-line'} relative`}
        >
          <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all ${!perBarber ? 'left-[18px]' : 'left-[2px]'}`}/>
        </span>
        <div className="flex-1">
          <div className="text-[14px] font-medium">Mismo horario para todos</div>
          <div className="text-[11px] text-muted mt-0.5">
            {perBarber ? 'Cada barbero con su horario' : 'Una sola matriz aplica al equipo entero'}
          </div>
        </div>
      </label>

      {perBarber && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {barbers.map((b, i) => {
            const sel = i === selectedBarber;
            return (
              <button key={i} type="button"
                onClick={() => setSelectedBarber(i)}
                className={`px-3 py-2 rounded-l text-[12px] font-medium transition active:scale-[0.97] whitespace-nowrap
                  ${sel ? 'bg-ink text-bg' : 'bg-card border border-line text-ink'}`}>
                {b.name || `Barbero ${i + 1}`}
              </button>
            );
          })}
        </div>
      )}

      <SectionLabel className="mt-2">
        {perBarber ? `HORARIOS DE ${(barbers[selectedBarber]?.name || `BARBERO ${selectedBarber + 1}`).toUpperCase()}` : 'HORARIOS DEL EQUIPO'}
      </SectionLabel>

      <div className="flex flex-col gap-2">
        {DAYS.map(d => {
          const row = currentSched.find(s => s.day_of_week === d.idx)
            || { day_of_week: d.idx, start_time: '10:00', end_time: '20:00', is_working: false };
          return (
            <div key={d.idx} className={`bg-card border border-line rounded-xl px-3 py-2.5 flex items-center gap-3 ${!row.is_working ? 'opacity-60' : ''}`}>
              <div className="w-12 text-[13px] font-medium">{d.short}</div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span
                  role="switch"
                  aria-checked={row.is_working}
                  tabIndex={0}
                  onClick={() => onPatch(d.idx, { is_working: !row.is_working })}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onPatch(d.idx, { is_working: !row.is_working }); } }}
                  className={`w-9 h-5 rounded-full transition flex-shrink-0 ${row.is_working ? 'bg-accent' : 'bg-line'} relative`}
                >
                  <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${row.is_working ? 'left-[18px]' : 'left-[2px]'}`}/>
                </span>
              </label>
              <div className="flex-1 flex items-center gap-2 justify-end">
                <input
                  type="time"
                  value={row.start_time.slice(0, 5)}
                  disabled={!row.is_working}
                  onChange={e => onPatch(d.idx, { start_time: e.target.value })}
                  className="bg-transparent text-ink outline-none font-mono text-[13px] border border-line rounded-m px-2 py-1 disabled:opacity-50"
                />
                <span className="text-muted text-[11px]">—</span>
                <input
                  type="time"
                  value={row.end_time.slice(0, 5)}
                  disabled={!row.is_working}
                  onChange={e => onPatch(d.idx, { end_time: e.target.value })}
                  className="bg-transparent text-ink outline-none font-mono text-[13px] border border-line rounded-m px-2 py-1 disabled:opacity-50"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
