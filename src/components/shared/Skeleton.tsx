export function Skeleton({
  className = '', dark = false, style
}: { className?: string; dark?: boolean; style?: React.CSSProperties }) {
  return <div className={`${dark ? 'skeleton-dark' : 'skeleton'} ${className}`} style={style} />;
}

export function SlotsSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[42px] rounded-m" />
      ))}
    </div>
  );
}

export function AgendaSkeleton({ dark = true }: { dark?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton dark={dark} className="h-[42px] w-[46px]" />
          <Skeleton dark={dark} className="h-[52px] flex-1 rounded-l" />
        </div>
      ))}
    </div>
  );
}
