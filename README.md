# 📱 الوسوف للاتصالات — Wassouf Store

**Arabic RTL E-commerce Storefront & Administration Dashboard**

A modern, full-stack web application for a telecommunications and mobile phone store, built with **Next.js 15 App Router**, **React 19**, and **Supabase**.

The application features a responsive Arabic storefront, product catalog, advanced search, inventory management, and a role-based administration dashboard.

**Technology Stack:** Next.js 15 · React 19 · TypeScript · TanStack Query · Supabase · PostgreSQL · Tailwind CSS v4 · shadcn/ui · Radix UI

---

## ✨ Features

- **Arabic RTL Experience** — Native right-to-left interface.
- **Product Catalog** — Browse products, brands, branches, and offers.
- **Product Search** — Search and filter using query, brand, and branch parameters.
- **Admin Dashboard** — Centralized store management.
- **Role-Based Access Control** — Owner, admin, editor, and inventory manager roles.
- **Inventory Management** — Manage products and stock.
- **Private Image Storage** — Supabase Storage with temporary signed URLs.
- **Database Security** — PostgreSQL Row Level Security (RLS).
- **Authentication** — Supabase Auth integration.
- **Responsive UI** — Optimized for mobile and desktop.

---

## 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 |
| Language | TypeScript |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Row Level Security (RLS) |
| File Storage | Supabase Private Storage |
| Database Migrations | Drizzle Kit |

---

## 🚀 Quick Start

### Prerequisites

- Node.js
- npm
- Supabase project

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

### Quality Checks

```bash
npm run typecheck
npm test
```

---

## ⚙️ Environment Variables

Configure the following variables in `.env.local`:

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + Server | Yes | Public publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Yes* | Privileged team-management operations |
| `NEXT_PUBLIC_SITE_URL` | Browser + Server | No | Application origin |
| `DATABASE_URL` | Local CLI | No | Drizzle Kit database connection |

\* Required for team-management operations.

**Security requirements:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never prefix the service-role key with `NEXT_PUBLIC_`.
- Keep privileged database operations server-side.
- Public client access is protected by Supabase RLS policies.

---

## 🗄️ Database Setup

The application uses Supabase PostgreSQL.

Apply the migrations in the following order:

1. `drizzle/migrations/0000_migration.sql`
   - Database tables
   - `can(uid, perm)` permission function
   - RLS policies
   - Database triggers

2. `drizzle/migrations/0001_migration.sql`
   - Storage access policies

3. `drizzle/migrations/0002_tighten_public_read_policies.sql`
   - Updated public read restrictions

### Storage Configuration

Create a private Supabase Storage bucket:

```text
Bucket: product-images
Visibility: Private
```

Do not make the bucket public.

### Authentication Configuration

Add your application URL and the following redirect URLs to Supabase Auth settings:

```text
https://your-domain.com/admin
https://your-domain.com/reset-password
```

### Initial Owner Setup

The first account that registers automatically becomes the store owner through a database trigger.

Open `/admin` and select:

**أول مرة؟ أنشئ حساب المالك**

The owner can subsequently manage team members and assign their roles through the administration dashboard.

---

## 👥 Administration & Permissions

The administration system implements role-based access control (RBAC).

| Role | Access |
|---|---|
| Owner | Full administrative control |
| Admin | Administrative operations |
| Editor | Content and product management |
| Inventory Manager | Inventory operations |

Permissions are maintained in two synchronized locations:

- SQL: `can(uid, perm)`
- TypeScript: `ROLE_PERMISSIONS` in `src/lib/shared.ts`

Any permission changes must be reflected in both implementations.

---

## 🔐 Authentication & Security

Security is enforced through Supabase authentication, database policies, and server-side authorization.

### Browser Authentication

`integrations/supabase/client.ts` uses the Supabase publishable key and the authenticated user's JWT.

Administrative operations involving products, inventory, and storage continue to execute under the authenticated user's permissions and RLS policies.

### Row Level Security

PostgreSQL RLS policies enforce access restrictions directly at the database level.

### Private Storage

- Product images remain in a private storage bucket.
- `signPaths()` generates signed image URLs.
- Signed URLs have a seven-day validity period.
- Upload and deletion operations remain subject to RLS.

### Team Management API

Team management is implemented through Next.js Route Handlers:

```text
app/api/team/
├── list/
│   └── route.ts
├── add/
│   └── route.ts
└── update/
    └── route.ts
```

Each handler:

1. Validates the user's Bearer token using `supabase.auth.getClaims`.
2. Verifies the caller's `admins:manage` permission using the SQL `can(uid, perm)` function.
3. Executes privileged operations using the server-side service-role client.

The service-role key is never exposed to client-side code.

---

## 🏗️ Application Architecture

The application uses the Next.js App Router architecture.

### Route Structure

| Route | Purpose |
|---|---|
| `/` | Storefront homepage |
| `/search` | Product search and filtering |
| `/brands` | Product brands |
| `/branches` | Store branches |
| `/product/[code]` | Product details |
| `/admin` | Administration dashboard |
| `/reset-password` | Password recovery |

### Main Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── search/
│   ├── brands/
│   ├── branches/
│   ├── product/
│   │   └── [code]/
│   ├── admin/
│   ├── reset-password/
│   ├── api/
│   │   └── team/
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   └── global-error.tsx
│
├── views/
├── components/
│   └── providers/
├── integrations/
│   └── supabase/
├── lib/
└── styles.css

drizzle/
└── migrations/

public/
└── images/
```

---

## 🖼️ Brand Assets

The following image files currently contain placeholder graphics and should be replaced with the original store assets:

| File | Usage |
|---|---|
| `public/images/logo-mark.png` | Header, footer, and login |
| `public/images/storefront.png` | Homepage hero fallback |
| `public/images/logo.png` | Reserved asset |

Product, offer, and hero images uploaded through the administration dashboard are stored separately in the private Supabase Storage bucket.

---

## 🔄 Framework Migration

The application was migrated from TanStack Start and TanStack Router to Next.js 15 App Router.

| Previous Implementation | Current Implementation |
|---|---|
| TanStack Start | Next.js 15 |
| TanStack Router | Next.js App Router |
| `src/routes/index.tsx` | `src/app/page.tsx` → `src/views/HomeView.tsx` |
| `routes/search.tsx` | `app/search/page.tsx` → `views/SearchView.tsx` |
| `routes/brands.tsx` | `app/brands/page.tsx` |
| `routes/branches.tsx` | `app/branches/page.tsx` |
| `routes/product.$code.tsx` | `app/product/[code]/page.tsx` |
| `routes/admin.tsx` | `app/admin/page.tsx` |
| `routes/reset-password.tsx` | `app/reset-password/page.tsx` |
| `__root.tsx` | `app/layout.tsx` and application error boundaries |
| `createServerFn` | Next.js Route Handlers |
| `useNavigate` | `useRouter` |
| `useRouterState` | `usePathname` / `useSearchParams` |
| `router.invalidate()` | `router.refresh()` + Query invalidation |
| Vite / Nitro | Next.js build system |

### Preserved Functionality

The migration maintains:

- Existing storefront and dashboard UI.
- All shared shadcn/ui components.
- Supabase database schema and SQL migrations.
- Authentication and authorization logic.
- RLS policies.
- TanStack Query configuration.
- `signPaths()` signed URL functionality.
- Shared permission definitions and tests.
- Existing Tailwind CSS v4 theme.

---

## 📝 Technical Notes

- Authentication sessions use Supabase's default browser `localStorage`.
- Public storefront data is fetched client-side through TanStack Query.
- Product titles and metadata are server-rendered, but product data is not included in the initial HTML.
- Product metadata currently uses the product code rather than the dynamically loaded product name.
- Dynamic Open Graph metadata would require a server-side Supabase product lookup.
- The `/admin` route is client-rendered and excluded from search indexing through `noindex` metadata and an `X-Robots-Tag` header.
- Storefront header, footer, and bottom navigation are hidden on the administration route.

---

## 📄 License

All rights reserved.

Developed for **الوسوف للاتصالات | Wassouf Store**.