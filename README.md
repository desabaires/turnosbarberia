# 💈 TurnosBarbería

Webapp SaaS de turnos para barberías · Next.js 14 + Supabase + Vercel.

Dos vistas (mobile-first, 390×844; responsive desktop en admin):
- **Cliente** (`/`, `/reservar`, `/mis-turnos`, `/perfil`) — login con magic link, reserva en 3 pasos.
- **Shop/Admin** (`/shop`, `/shop/caja`, `/shop/equipo`) — agenda del día, caja, equipo y ocupación. Gateado por `is_admin = true` en `profiles`.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres + Auth (magic link) + RLS + Realtime
- Deploy: Vercel
- Email: Resend

---

## Setup local

```bash
npm install
cp .env.example .env.local
# Editá .env.local con tus claves de Supabase
npm run dev
```

Abrí http://localhost:3000

## Variables de entorno

| Variable | Dónde sacarla |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase → Project Settings → API → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase → Project Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase → Project Settings → API → "service_role" (¡nunca commitear!) |
| `NEXT_PUBLIC_SITE_URL`            | URL pública del sitio (en local: `http://localhost:3000`; en prod: dominio Vercel) |
| `RESEND_API_KEY`                  | Resend → API Keys (opcional, para emails de confirmación) |

---

## Aplicar el schema a Supabase (una vez)

**Opción A — SQL Editor (manual):**
1. Abrí el SQL Editor del dashboard de Supabase.
2. Pegá [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) → Run.
3. Pegá [`supabase/migrations/0002_fix_encoding.sql`](./supabase/migrations/0002_fix_encoding.sql) → Run.
4. Pegá [`supabase/seed.sql`](./supabase/seed.sql) → Run.

**Opción B — Programáticamente:**
```bash
npm install pg --no-save
node scripts/apply-schema.mjs "postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```
(Usá la connection string del pooler; la directa es IPv6-only.)

## Configurar Auth en Supabase

1. **Site URL**: Supabase → Authentication → URL Configuration → poné tu URL de Vercel.
2. **Redirect URLs**: agregar `https://tu-dominio.vercel.app/auth/callback` y `http://localhost:3000/auth/callback`.
3. **Email templates** (opcional): customizar el "Magic Link" desde Authentication → Email Templates.

## Hacer admin a un usuario

Una vez que un usuario hizo login al menos una vez:
```sql
update public.profiles set is_admin = true where email = 'tu@email.com';
```
Luego va a `/shop` y tiene acceso al panel.

---

## Deploy a Vercel

```bash
npx vercel --prod
# Cargá las 5 env vars en Vercel Dashboard → Project → Settings → Environment Variables.
```

O directo desde el dashboard de Vercel: "Import Git Repository" → seleccionar este repo → cargar env vars → Deploy.

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx                 # Root, fuentes, container mobile
│   ├── globals.css                # Tokens + barber-pole stripe
│   ├── page.tsx                   # Home cliente
│   ├── login/                     # Login (magic link)
│   ├── reservar/                  # Flujo de reserva (3 pasos)
│   ├── confirmacion/[id]/         # Ticket post-reserva
│   ├── mis-turnos/                # Próximos + historial
│   ├── perfil/
│   ├── shop/                      # Panel admin (RLS gate en layout)
│   │   ├── page.tsx               # Agenda del día
│   │   ├── caja/                  # Caja del día
│   │   ├── equipo/                # Equipo + ocupación
│   │   └── ajustes/
│   ├── api/availability/route.ts  # Slots disponibles
│   ├── auth/callback/route.ts     # OAuth/magic link callback
│   └── actions/                   # Server actions (auth, booking, demo)
├── components/
│   ├── shared/                    # Icon, Avatar, Pill, Stripe
│   ├── client/                    # Pantallas cliente
│   └── shop/                      # Pantallas shop
├── lib/
│   ├── supabase/                  # browser/server/middleware
│   ├── availability.ts            # Lógica de slots
│   ├── format.ts                  # money(), fechas AR
│   ├── shop-info.ts               # Info del shop (a reemplazar por lookup multi-tenant)
│   └── demo.ts                    # Cuentas y flags de demo
├── types/db.ts
└── middleware.ts                  # Refresh de sesión Supabase

supabase/
├── migrations/                    # Schema + RLS + indices + realtime
└── seed.sql                       # Barberos, servicios, horarios, productos
```

## Scripts

```bash
npm run dev         # Dev server con HMR
npm run build       # Build de producción
npm run start       # Servir build local
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

---

## Roadmap

- [ ] Multi-tenant: tabla `shops`, rutas por slug, onboarding del dueño
- [ ] Desktop responsive para `/shop/*`
- [ ] Emails de confirmación/cancelación con Resend
- [ ] Realtime en `/shop` (suscribirse a `appointments`)
- [ ] Modal de "Cobrar servicio" / "Vender producto" en `/shop/caja`
- [ ] Editor de horarios y barberos en `/shop/ajustes`
- [ ] Recordatorio WhatsApp 24hs antes
- [ ] Landing page de venta
