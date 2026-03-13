# Field Genius Backoffice — Admin Dashboard

> **Repo:** `quack2025/field-genius-backoffice`
> **Deploy:** Vercel — `https://field-genius-backoffice.vercel.app`
> **Branch:** `master` (NOT main)
> **Backend:** `quack2025/field-genius-engine` (FastAPI on Railway)

---

## Stack

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 8 | Build tool |
| Tailwind CSS | 3.4 | Styling (NOT v4 — v4 had eresolve issues) |
| Supabase Auth | via `@supabase/supabase-js` | Email/password login |
| lucide-react | Icons | |
| react-router-dom | 7 | Client-side routing |

No component library — raw HTML + Tailwind classes.

---

## Estructura del proyecto

```
field-genius-backoffice/
├── CLAUDE.md              # Este archivo
├── vercel.json            # SPA rewrite: /(.*) → /
├── tailwind.config.js     # Brand color: #003366
├── src/
│   ├── App.tsx            # Router + auth guard
│   ├── main.tsx           # Entry point
│   ├── index.css          # Tailwind directives
│   ├── components/
│   │   ├── Layout.tsx     # Sidebar + Outlet wrapper
│   │   └── Sidebar.tsx    # Navigation links
│   ├── hooks/
│   │   └── useAuth.ts     # Supabase Auth (email/password)
│   ├── lib/
│   │   ├── api.ts         # API client — all calls to Railway backend
│   │   └── supabase.ts    # Supabase client init
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx           # Stats cards, time filter, breakdowns
│       ├── Implementations.tsx     # Card grid + create form
│       ├── ImplementationDetail.tsx # 4 tabs: Config, Visit Types, Prompts, Users
│       ├── Sessions.tsx            # Filterable table (impl, status, dates)
│       ├── SessionDetail.tsx       # Media timeline + visit reports panel
│       └── tabs/                   # Tab components for ImplementationDetail
```

---

## Páginas y rutas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | Dashboard | Stats cards (sessions, reports, avg confidence), time filter, breakdowns |
| `/implementations` | Implementations | Card grid with create form |
| `/implementations/:id` | ImplementationDetail | 4 tabs: Config, Visit Types, Prompts, Users |
| `/sessions` | Sessions | Filterable table (impl, status, dates) |
| `/sessions/:id` | SessionDetail | Media timeline + visit reports panel |

---

## API Client (`src/lib/api.ts`)

Todas las llamadas van a `VITE_API_URL` (Railway backend). Response wrapper:

```typescript
interface ApiResponse<T> { success: boolean; data: T; error: string | null; }
```

Interfaces clave: `Implementation`, `VisitType`, `User`, `Stats`, `Session`, `RawFile`, `VisitReport`

---

## Auth

- Supabase Auth via `useAuth.ts`
- Login con email/password → Supabase session
- Admin user: `jorgealejandrorosales@gmail.com`
- No RLS ni JWT validation en backend todavía (PENDIENTE)

---

## Variables de entorno

```
VITE_SUPABASE_URL=https://sglvhzmwfzetyrhwouiw.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_API_URL=https://zealous-endurance-production-f9b2.up.railway.app
```

---

## Patrones de estilo

- **Brand color:** `#003366` (brand-500 en tailwind.config.js)
- **Cards:** `bg-white rounded-lg shadow p-4`
- **Tables:** `bg-white rounded-lg shadow` → `table w-full text-sm`
- **Buttons:** `bg-brand-500 text-white px-4 py-2 rounded text-sm hover:bg-brand-600`
- **Status badges:** colored bg+text (blue=accumulating, green=completed, red=failed)

---

## TypeScript — Reglas importantes

- `verbatimModuleSyntax` habilitado — SIEMPRE usar `import type {}` para type-only imports
- No hay `@/` path aliases — usar imports relativos (`../lib/api`)
- Build: `tsc -b && vite build`

---

## Deploy

- **Plataforma:** Vercel
- **Comando:** `vercel --prod` desde raíz del repo
- **SPA routing:** `vercel.json` con rewrite `/(.*) → /`
- **Auto-deploy:** NO configurado — deploy manual
- **Branch:** `master`

---

## Backend relacionado

El backend está en un repo separado: `quack2025/field-genius-engine`
- Path local: `C:\Users\jorge\field-genius-engine`
- Documentación detallada en `field-genius-engine/agent_docs/`
- Deploy: Railway (auto-deploy on push to `main`)
- API base: `https://zealous-endurance-production-f9b2.up.railway.app`
