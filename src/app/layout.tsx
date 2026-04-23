import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PRODUCT } from '@/lib/shop-info';

export const metadata: Metadata = {
  title: PRODUCT.name,
  description: PRODUCT.tagline,
  applicationName: PRODUCT.name,
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: PRODUCT.name }
};

export const viewport: Viewport = {
  themeColor: '#0E0E0E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <div className="mx-auto min-h-screen max-w-[440px] bg-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
