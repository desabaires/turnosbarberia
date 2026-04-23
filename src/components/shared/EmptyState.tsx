import Link from 'next/link';
import { Icon } from './Icon';

type IconName = Parameters<typeof Icon>[0]['name'];

export function EmptyState({
  icon = 'calendar',
  title,
  description,
  ctaLabel,
  ctaHref,
  dark = false
}: {
  icon?: IconName;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  dark?: boolean;
}) {
  const colors = dark
    ? { bg: 'bg-dark-card', border: 'border-dark-line', chip: 'bg-dark', chipFg: '#8C8A83', title: 'text-bg', desc: 'text-dark-muted' }
    : { bg: 'bg-card', border: 'border-line', chip: 'bg-bg', chipFg: '#7A766E', title: 'text-ink', desc: 'text-muted' };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl px-6 py-8 text-center`}>
      <div className={`mx-auto w-12 h-12 rounded-full ${colors.chip} grid place-items-center`}>
        <Icon name={icon} size={22} color={colors.chipFg} />
      </div>
      <div className={`font-display text-[22px] ${colors.title} mt-4 leading-tight`}>{title}</div>
      {description && (
        <div className={`text-[13px] ${colors.desc} mt-1.5 max-w-[280px] mx-auto`}>{description}</div>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 mt-4 bg-accent text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition"
        >
          {ctaLabel} <Icon name="arrow-right" size={14} color="#fff" />
        </Link>
      )}
    </div>
  );
}
