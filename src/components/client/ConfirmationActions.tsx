'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/shared/Icon';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export function ConfirmationActions({
  startISO, endISO, service, barber, orderNum
}: {
  startISO: string;
  endISO: string;
  service: string;
  barber: string;
  orderNum: string;
}) {
  const [shared, setShared] = useState<null | 'ok' | 'fail'>(null);

  const { icsHref, gcalHref, shareText } = useMemo(() => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const title = `Turno en El Estudio · ${service}`;
    const details = `Con ${barber}. N° ${orderNum}. Dirección: Av. Honduras 5850, Palermo, Buenos Aires.`;
    const location = 'Av. Honduras 5850, Palermo, Buenos Aires';

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//El Estudio//Turnos//ES',
      'BEGIN:VEVENT',
      `UID:${orderNum}@elestudio.app`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    const gcalHref =
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${toICSDate(start)}/${toICSDate(end)}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(location)}`;

    const shareText = `Reservé turno en El Estudio: ${service} con ${barber}, ${start.toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}hs.`;
    return { icsHref, gcalHref, shareText };
  }, [startISO, endISO, service, barber, orderNum]);

  const canShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  const onShare = async () => {
    try {
      await (navigator as any).share({ title: 'Turno · El Estudio', text: shareText });
      setShared('ok');
    } catch {
      setShared('fail');
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-2">
      <a
        href={icsHref}
        download={`turno-elestudio-${orderNum}.ics`}
        className="bg-ink text-bg px-4 py-4 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        <Icon name="calendar" size={16} color="#F5F3EE" />
        Agregar al calendario
      </a>
      <div className="flex gap-2">
        <a
          href={gcalHref}
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-card border border-line text-ink px-3 py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          Google Calendar
        </a>
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex-1 bg-card border border-line text-ink px-3 py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
            aria-label="Compartir turno"
          >
            <Icon name="arrow-right" size={14} />
            {shared === 'ok' ? '¡Listo!' : 'Compartir'}
          </button>
        )}
      </div>
    </div>
  );
}
