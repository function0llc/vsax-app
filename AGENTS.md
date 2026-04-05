# MSP Dashboard — Agent Instructions

## Project Overview

A Next.js 14+ (App Router) dashboard for internal MSP use, integrating **Kaseya VSA X** (RMM) and **Datto SaaS Protection** (Backup) APIs into a unified monitoring interface. All data access goes through Next.js API routes backed by PostgreSQL (via Prisma), deployed with Docker Compose.

---

## Mandatory Rules

These rules are non-negotiable. Follow them on every task without exception.

### Language & Runtime
- All files must be **TypeScript**. Never create plain `.js` files.
- Use **strict** TypeScript — no `any` types unless absolutely unavoidable, and always add a comment explaining why.
- Target **Node.js 20+** runtime features only.

### Framework & Routing
- Use the **Next.js App Router** exclusively. Never use Pages Router patterns (`getServerSideProps`, `getStaticProps`, `pages/` directory, etc.).
- Server Components are the default. Only use `"use client"` when the component genuinely requires browser APIs, event handlers, or React hooks.
- All backend logic lives in **API Route Handlers** (`src/app/api/**/route.ts`). Never put database or encryption logic in Server Components directly.

### Database
- All database access must go through **Prisma** (`src/lib/prisma.ts`). Never write raw SQL.
- Always use the Prisma client singleton from `src/lib/prisma.ts` — never instantiate `new PrismaClient()` in other files.
- Use `upsert` for sync operations to avoid duplicate records.
- Run `prisma migrate dev` for schema changes during development; never edit the database directly.

### Security — API Keys & Secrets
- **Never store plaintext API keys anywhere** — not in env vars, not in the database, not in logs.
- All API credentials (VSA X, Datto) are stored **AES-256-GCM encrypted** in the `ApiCredential` table.
- Always use `src/lib/crypto.ts` `encrypt()` / `decrypt()` functions when reading or writing credentials.
- The only secret in `.env.local` that relates to external APIs is `ENCRYPTION_MASTER_KEY`.
- Never log decrypted API keys, even at debug level.
- API key display in the UI must always be masked: show only the last 4 characters (`****...abcd`).

### Authentication & Authorization
- All API routes (except `/api/auth/*`) must validate the NextAuth.js session before processing.
- Use `getServerSession(authOptions)` from `src/lib/auth.ts` in every API route handler.
- Return `401` for unauthenticated requests and `403` for unauthorized ones.
- Never expose the Settings/credentials pages or API endpoints to unauthenticated users.

### Styling & UI Components
- Use **Tailwind CSS** for all styling. Never write custom CSS files or use inline `style` props except for truly dynamic values (e.g., chart colors).
- Always prefer **shadcn/ui** components over building custom UI primitives. Check `src/components/ui/` before writing a new component.
- Use **lucide-react** for all icons.
- Use `clsx` + `tailwind-merge` (via the `cn()` utility in `src/lib/utils.ts`) for conditional class merging. Never concatenate class strings manually.

### Data Fetching
- Use **TanStack Query** (`@tanstack/react-query`) for all client-side data fetching. Never use `useEffect` + `fetch` directly for server data.
- Define query keys as constants to avoid typos and enable cache invalidation.
- API route handlers that proxy to external APIs must fetch credentials from the database via `src/services/credentials.ts` — never accept API keys from the client.

### Error Handling
- All API route handlers must have try/catch blocks and return consistent JSON error responses: `{ error: string, details?: string }`.
- Use HTTP status codes correctly: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- Client-side errors should use toast notifications (shadcn/ui `toast` or `sonner`).
- Never expose raw error messages or stack traces to the client in production.

### File & Code Organization
- Follow the project structure exactly as defined in the **Project Structure** section below.
- One component per file. File name must match the exported component name.
- Keep components under 200 lines. Extract sub-components or hooks when they grow larger.
- Place shared TypeScript types in `src/types/index.ts`. Place service-specific types in `src/services/{provider}/types.ts`.

### Environment Variables
- Only these env vars exist — never assume others:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `ENCRYPTION_MASTER_KEY`
  - `DATABASE_URL`
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed script only)
- All env vars are validated at startup. If one is missing, throw a clear error immediately.

### What NOT to Build (Phase 1 Scope)
- No ticketing integration — this is explicitly deferred to a future phase.
- No role-based access control beyond authenticated vs. unauthenticated.
- No SSO/OIDC/SAML.
- No webhook listeners (polling only for now).
- No email or Slack notifications.
- No dark mode.

---

## Code Patterns

### Prisma Client Singleton (`src/lib/prisma.ts`)
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Encryption Usage (`src/lib/crypto.ts`)
```ts
// Encrypting before DB write
const encrypted = encrypt(plaintextApiKey) // returns "iv:authTag:ciphertext"
await prisma.apiCredential.create({ data: { encryptedApiKey: encrypted, ... } })

// Decrypting before API call
const cred = await prisma.apiCredential.findFirst({ where: { provider: 'vsax', isActive: true } })
const apiKey = decrypt(cred.encryptedApiKey)
```

### API Route Handler Pattern
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // ... logic
    return NextResponse.json(data)
  } catch (error) {
    console.error('[route] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### TanStack Query Hook Pattern
```ts
import { useQuery } from '@tanstack/react-query'

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/vsax/devices')
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
    staleTime: 60_000,
  })
}
```

### cn() Utility Usage
```ts
import { cn } from '@/lib/utils'

// Always use cn() for conditional classes
<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## Project Structure

```
vsax-dashboard/
├── .env.local                   # Master encryption key + NextAuth secrets only
├── .env.example                 # Template — commit this, never .env.local
├── docker-compose.yml           # App + PostgreSQL + PGAdmin
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # Creates initial admin user
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (QueryProvider, SessionProvider)
│   │   ├── page.tsx             # Overview dashboard
│   │   ├── login/page.tsx
│   │   ├── devices/page.tsx
│   │   ├── backups/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── vsax/devices/route.ts
│   │       ├── vsax/alerts/route.ts
│   │       ├── datto/domains/route.ts
│   │       ├── datto/seats/route.ts
│   │       ├── datto/backup-status/route.ts
│   │       ├── settings/credentials/route.ts
│   │       └── sync/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components only
│   │   ├── layout/              # Sidebar, Header, DashboardShell
│   │   ├── devices/             # DeviceTable, DeviceStatusCard, DeviceFilters
│   │   ├── backups/             # BackupStatusTable, BackupSummaryCard, BackupTrendChart
│   │   ├── alerts/              # AlertList
│   │   ├── settings/            # ApiKeyForm, ApiKeyList
│   │   └── dashboard/           # OverviewCards, StatusSummary, RecentActivity
│   ├── lib/
│   │   ├── prisma.ts            # Prisma singleton — import from here only
│   │   ├── auth.ts              # NextAuth config + authOptions export
│   │   ├── crypto.ts            # encrypt() / decrypt() using AES-256-GCM
│   │   └── utils.ts             # cn() and shared utilities
│   ├── services/
│   │   ├── vsax/client.ts       # VSA X API client
│   │   ├── vsax/types.ts
│   │   ├── vsax/endpoints.ts
│   │   ├── datto/client.ts      # Datto SaaS API client
│   │   ├── datto/types.ts
│   │   ├── datto/endpoints.ts
│   │   └── credentials.ts       # Fetches + decrypts API keys from DB
│   ├── hooks/
│   │   ├── useDevices.ts
│   │   ├── useBackups.ts
│   │   └── useAlerts.ts
│   └── types/
│       └── index.ts             # Shared app-wide types
```

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript |
| Auth | NextAuth.js v4 — Credentials provider, JWT sessions |
| Database | PostgreSQL 16 via Docker |
| ORM | Prisma 5 |
| Encryption | Node.js `crypto` — AES-256-GCM |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | lucide-react |
| Charts | Recharts |
| HTTP Client | Native `fetch` (prefer over Axios) |
| Server State | TanStack Query v5 |
| Deployment | Docker Compose |

---

## Database Models (Prisma)

| Model | Key Fields |
|---|---|
| `User` | `id`, `email`, `name`, `hashedPassword` |
| `ApiCredential` | `id`, `provider` (`vsax`/`datto`), `label`, `encryptedApiKey`, `encryptedApiSecret`, `baseUrl`, `isActive` |
| `Device` | `id`, `vsaxDeviceId` (unique), `hostname`, `osType`, `status`, `orgName`, `lastSeen` |
| `BackupDomain` | `id`, `dattoDomainId` (unique), `domainName`, `totalSeats`, `protectedSeats`, `status`, `lastBackupAt` |
| `BackupSeat` | `id`, `dattoSeatId` (unique), `domainId` (FK), `userEmail`, `seatType`, `lastBackupStatus`, `lastBackupAt` |
| `Alert` | `id`, `sourceApi`, `externalId`, `severity`, `title`, `status`, `deviceId` (FK), `triggeredAt`, `resolvedAt` |
| `SyncLog` | `id`, `syncType`, `status`, `recordsProcessed`, `errorMessage`, `startedAt`, `completedAt` |

Encryption storage format for `encryptedApiKey` / `encryptedApiSecret`: `base64(iv):base64(authTag):base64(ciphertext)`

---

## External API Reference

### Kaseya VSA X
- Auth: `Authorization: Bearer <token>`
- Key endpoints: `GET /api/v1/agents`, `GET /api/v1/agents/{id}`, `GET /api/v1/alerts`, `GET /api/v1/organizations`

### Datto SaaS Protection
- Auth: HTTP Basic Auth (API key as username, secret as password)
- Key endpoints: `GET /v1/saas/domains`, `GET /v1/saas/domains/{id}/seats`, `GET /v1/saas/domains/{id}/seats/bulkSeatStatus`
- Docs: https://portal.dattobackup.com/integrations/api

---

## Implementation Sequence

When building from scratch, follow this order:

1. Project scaffolding (Next.js + TypeScript + Tailwind + shadcn/ui init)
2. Docker Compose (app + PostgreSQL + PGAdmin)
3. Prisma schema + initial migration
4. Prisma seed script (admin user with bcrypt password)
5. `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt
6. NextAuth.js configuration + route protection
7. Settings API routes + UI (credential CRUD with encryption)
8. VSA X and Datto API service clients (`src/services/`)
9. API proxy routes (`src/app/api/vsax/`, `src/app/api/datto/`)
10. Dashboard shell (Sidebar, Header, DashboardShell layout)
11. Overview page
12. Device monitoring page
13. Backup status page
14. Alerts page
15. Background sync scheduler (node-cron)
16. Error handling polish, loading skeletons, toast notifications
