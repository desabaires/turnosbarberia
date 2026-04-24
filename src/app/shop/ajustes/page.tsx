import { ShopHeader } from '@/components/shop/ShopHeader';
import { signOut } from '@/app/actions/auth';

export default function AjustesPage() {
  return (
    <main className="flex-1 flex flex-col mx-auto w-full max-w-[440px] md:max-w-none md:mx-0">
      <ShopHeader subtitle="Ajustes" title="Configuración"/>
      <div className="flex-1 px-5 pt-4 pb-5 md:max-w-2xl md:w-full md:mx-auto md:px-8 md:pt-8">
        <div className="bg-dark-card border border-dark-line rounded-xl p-4 md:p-6 text-bg">
          <div className="font-display text-[22px] md:text-[28px] mb-2">Próximamente</div>
          <div className="text-[13px] md:text-[14px] text-dark-muted">
            Edición de horarios, gestión de barberos, productos y más.
          </div>
        </div>
        <form action={signOut} className="mt-3">
          <button className="w-full bg-dark-card border border-dark-line text-bg rounded-xl px-4 py-3.5 text-[14px] font-medium text-left hover:border-bg/30 transition">
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
