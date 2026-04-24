import { Icon } from '@/components/shared/Icon';
import { Stripe } from '@/components/shared/Stripe';
import { EmptyState } from '@/components/shared/EmptyState';
import { money } from '@/lib/format';
import type { Sale, Product } from '@/types/db';

export function CashView({ sales, products }: { sales: Sale[]; products: Product[] }) {
  const total = sales.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totServ = sales.filter(s => s.type === 'service').reduce((a, x) => a + Number(x.amount), 0);
  const totProd = sales.filter(s => s.type === 'product').reduce((a, x) => a + Number(x.amount), 0);

  return (
    <div className="flex-1 overflow-auto px-5 pt-4 pb-5 md:px-8">
      {/* Big total */}
      <div className="bg-bg text-ink rounded-2xl px-5 py-4 relative overflow-hidden md:px-7 md:py-6">
        <Stripe className="absolute top-0 left-0 right-0"/>
        <div className="font-mono text-[10px] tracking-[2px] text-muted mt-2">TOTAL DÍA</div>
        <div className="font-display text-[48px] leading-none mt-1.5 -tracking-[1px] md:text-[64px]">{money(total)}</div>
        <div className="flex gap-2.5 mt-3.5 md:max-w-md">
          <Tile l="Servicios" v={money(totServ)}/>
          <Tile l="Productos" v={money(totProd)}/>
        </div>
      </div>

      <div className="flex gap-2 mt-3.5 md:max-w-xl">
        <button
          type="button"
          className="flex-1 min-h-[48px] bg-dark-card text-bg border border-dark-line px-3 py-3 rounded-l text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition hover:border-bg/30"
        >
          <Icon name="bag" size={16}/> Vender producto
        </button>
        <button
          type="button"
          className="flex-1 min-h-[48px] text-white px-3 py-3 rounded-l text-[13px] font-semibold flex items-center justify-center gap-1.5 bg-accent active:scale-[0.98] transition"
        >
          <Icon name="plus" size={16} color="#fff"/> Cobrar servicio
        </button>
      </div>

      <SectionLabel className="mt-6">MOVIMIENTOS · {sales.length}</SectionLabel>
      {sales.length === 0 ? (
        <EmptyState
          dark
          icon="cash"
          title="Caja vacía por ahora"
          description="Cuando cobres un servicio o vendas un producto, va a aparecer acá."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="bg-dark-card border border-dark-line rounded-xl overflow-hidden md:hidden">
            {sales.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 px-3.5 py-3 ${i < sales.length - 1 ? 'border-b border-dark-line' : ''}`}>
                <div className="w-[30px] h-[30px] rounded-s bg-dark grid place-items-center text-bg">
                  <Icon name={s.type === 'product' ? 'bag' : 'scissors'} size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-bg truncate">
                    {s.type === 'product' ? products.find(p => p.id === s.product_id)?.name || 'Producto' : 'Servicio'}
                  </div>
                  <div className="text-[11px] text-dark-muted mt-0.5 truncate">
                    {new Date(s.created_at).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', hour12:false })}
                    {s.customer_name ? ` · ${s.customer_name}` : ''} · {labelMethod(s.payment_method)}
                  </div>
                </div>
                <div className="font-mono text-[13px] font-semibold text-bg">{money(Number(s.amount))}</div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-dark-card border border-dark-line rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-line bg-dark/40">
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3">HORA</th>
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3">TIPO</th>
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3">DESCRIPCIÓN</th>
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3">CLIENTE</th>
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3">MÉTODO</th>
                  <th className="font-mono text-[10px] tracking-[2px] text-dark-muted font-normal px-4 py-3 text-right">MONTO</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id} className={`${i < sales.length - 1 ? 'border-b border-dark-line' : ''} hover:bg-dark/30 transition`}>
                    <td className="px-4 py-3 font-mono text-[12px] text-bg whitespace-nowrap">
                      {new Date(s.created_at).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', hour12:false })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-bg">
                        <Icon name={s.type === 'product' ? 'bag' : 'scissors'} size={14}/>
                        {s.type === 'product' ? 'Producto' : 'Servicio'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-bg">
                      {s.type === 'product' ? products.find(p => p.id === s.product_id)?.name || 'Producto' : 'Servicio'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-dark-muted">{s.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-dark-muted">{labelMethod(s.payment_method)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold text-bg whitespace-nowrap">{money(Number(s.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SectionLabel className="mt-6">STOCK · PRODUCTOS</SectionLabel>
      {products.length === 0 ? (
        <EmptyState
          dark
          icon="bag"
          title="Sin productos cargados"
          description="Agregá productos desde Ajustes para empezar a venderlos desde la caja."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5">
          {products.map(p => {
            const low = p.stock < 10;
            return (
              <div key={p.id} className="bg-dark-card border border-dark-line rounded-l px-3.5 py-3">
                <div className="text-[13px] font-medium text-bg truncate">{p.name}</div>
                <div className="font-mono text-[13px] font-semibold mt-1 text-accent">{money(Number(p.price))}</div>
                <div className={`text-[10px] mt-1 ${low ? 'text-accent' : 'text-dark-muted'}`}>
                  {low ? '⚠ ' : ''}Stock: {p.stock}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tile({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex-1 bg-bg border border-line px-3 py-2.5 rounded-m">
      <div className="text-[10px] text-muted uppercase">{l}</div>
      <div className="font-mono text-[15px] font-semibold mt-0.5">{v}</div>
    </div>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-mono text-[10px] tracking-[2px] text-dark-muted mb-2.5 ${className}`}>{children}</div>;
}

function labelMethod(m: string) {
  switch (m) {
    case 'efectivo':       return 'Efectivo';
    case 'transferencia':  return 'Transferencia';
    case 'debito':         return 'Débito';
    case 'credito':        return 'Crédito';
    default:               return m;
  }
}
