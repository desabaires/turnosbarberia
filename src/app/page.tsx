import { LandingPage } from '@/components/marketing/LandingPage';

export const dynamic = 'force-dynamic';

// La landing es siempre comercial: navbar muestra Login/Registrate, punto.
// Sin shortcuts a paneles ni a "última barbería visitada". Si alguien ya
// está logueado y clickea "Entrar", /login se encarga de redirigirlo al
// destino correcto (panel, onboarding o su barbería atada).
export default function RootPage() {
  return <LandingPage viewer={null} />;
}
