# MSP Dashboard

Internal MSP dashboard integrating **Kaseya VSA X** (RMM) and **Datto SaaS Protection** (Backup) APIs into a unified monitoring interface. Built with Next.js 14 App Router, backed by PostgreSQL via Prisma, deployed with Docker Compose.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router), TypeScript |
| Auth | NextAuth.js v4 — Credentials provider, JWT sessions |
| Database | PostgreSQL 16 (Docker) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Encryption | Node.js `crypto` — AES-256-GCM |
| Styling | Tailwind CSS 3 + shadcn/ui v4 |
| Icons | lucide-react |
| Charts | Recharts 3 |
| Server State | TanStack Query v5 |
| Toasts | Sonner |
| Deployment | Docker Compose |

---

## Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose
- Git

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd vsax-app
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

| Variable | Generate |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_MASTER_KEY` | `openssl rand -hex 32` |
| `DATABASE_URL` | `postgresql://mspdash:mspdash_secret@localhost:5432/mspdashboard` |
| `ADMIN_EMAIL` | Set your admin email |
| `ADMIN_PASSWORD` | Set a strong password |

### 3. Start the database

```bash
docker compose up -d db pgadmin
```

### 4. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the seeded admin credentials.

---

## Docker Deployment

Run the full stack via Docker Compose:

```bash
docker compose up --build
```

The `app` service overrides `DATABASE_URL` internally to use the Docker service name `db` instead of `localhost`.

---

## Access Points

| Service | URL | Credentials |
|---|---|---|
| Dashboard | http://localhost:3000 | Seeded admin email/password |
| PGAdmin | http://localhost:5050 | `admin@function0.com` / `pgadmin_secret` |
| PostgreSQL | localhost:5432 | `mspdash` / `mspdash_secret` / db: `mspdashboard` |

> When connecting to PostgreSQL from PGAdmin, use hostname `db` (the Docker service name) instead of `localhost`.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start development server |
| `npm run build` | `next build` | Create production build |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `next lint` | Run ESLint |
| `npm run db:migrate` | `prisma migrate dev` | Run Prisma migrations |
| `npm run db:generate` | `prisma generate` | Regenerate Prisma client |
| `npm run db:seed` | `ts-node ... prisma/seed.ts` | Seed initial admin user |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## Project Structure

```
vsax-app/
├── docker-compose.yml           # App + PostgreSQL + PGAdmin
├── Dockerfile                   # Multi-stage Node.js 20 Alpine build
├── next.config.mjs              # Next.js config (standalone output)
├── tailwind.config.ts           # Tailwind + shadcn/ui theme
├── prisma/
│   ├── schema.prisma            # 7 models: User, ApiCredential, Device, BackupDomain, BackupSeat, Alert, SyncLog
│   ├── prisma.config.ts         # Prisma config with dotenv + pg adapter
│   └── seed.ts                  # Creates initial admin user (bcrypt)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (SessionProvider, QueryClientProvider, Toaster)
│   │   ├── page.tsx             # Overview dashboard
│   │   ├── login/page.tsx       # Login page
│   │   ├── devices/page.tsx      # Device monitoring
│   │   ├── backups/page.tsx      # Backup status
│   │   ├── alerts/page.tsx       # Alert feed
│   │   ├── settings/page.tsx     # API credential management
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── vsax/devices/route.ts
│   │       ├── vsax/alerts/route.ts
│   │       ├── datto/domains/route.ts
│   │       ├── datto/seats/route.ts
│   │       ├── datto/backup-status/route.ts
│   │       ├── settings/credentials/route.ts
│   │       ├── settings/credentials/[id]/route.ts
│   │       └── sync/route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, card, table, dialog, etc.)
│   │   ├── layout/               # DashboardShell, Sidebar, Header, Providers
│   │   ├── auth/                 # LoginForm
│   │   ├── dashboard/             # OverviewCards, RecentActivity
│   │   ├── devices/              # DeviceTable
│   │   ├── backups/              # BackupStatusTable
│   │   ├── alerts/               # AlertList
│   │   └── settings/             # ApiKeyForm, ApiKeyList
│   ├── lib/
│   │   ├── prisma.ts             # Prisma singleton (PrismaPg adapter + pg.Pool)
│   │   ├── auth.ts               # NextAuth config (Credentials, JWT, bcrypt)
│   │   ├── crypto.ts             # AES-256-GCM encrypt/decrypt/maskApiKey
│   │   └── utils.ts              # cn() utility (clsx + tailwind-merge)
│   ├── services/
│   │   ├── credentials.ts        # Fetch + decrypt API keys from DB
│   │   ├── vsax/client.ts        # VsaxClient class (Basic Auth)
│   │   ├── vsax/types.ts
│   │   ├── vsax/endpoints.ts     # /api/v3/devices, /api/v3/notifications, /api/v3/organizations
│   │   ├── datto/client.ts       # DattoClient class (Basic Auth)
│   │   ├── datto/types.ts
│   │   └── datto/endpoints.ts    # /v1/saas/domains, /v1/saas/domains/{id}/seats, ...
│   ├── hooks/
│   │   ├── useDevices.ts
│   │   ├── useBackups.ts         # useBackupDomains, useBackupSeats
│   │   └── useAlerts.ts
│   └── types/
│       └── index.ts              # Shared app-wide TypeScript types
```

---

## Dashboard Pages

- **Overview** (`/`) — Summary cards: devices online, domains protected, active alerts, critical alerts. Recent activity feed.
- **Devices** (`/devices`) — Searchable device table with hostname, OS, status, last seen, organization. Status badges (online/offline/warning).
- **Backups** (`/backups`) — Domain-level backup status table with total/protected/unprotected seat counts. Last backup timestamp and status badges.
- **Alerts** (`/alerts`) — Alert feed with severity and status filter dropdowns. Links alerts to related devices.
- **Settings** (`/settings`) — API credential management. Add, test, enable/disable, delete credentials for VSA X and Datto providers. Keys displayed masked (last 4 chars only).

---

## API Routes

All routes except `/api/auth/*` require an authenticated NextAuth session.

| Route | Methods | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js authentication handler |
| `/api/vsax/devices` | GET | Fetch devices from VSA X API, upsert to DB, return results |
| `/api/vsax/alerts` | GET | Fetch notifications from VSA X API, upsert to DB, return results |
| `/api/datto/domains` | GET | Fetch domains from Datto API, upsert to DB, return results |
| `/api/datto/seats` | GET | Fetch seats for a domain (`?domainId=`), upsert to DB |
| `/api/datto/backup-status` | GET | Get bulk seat status for a domain (`?domainId=`) |
| `/api/settings/credentials` | GET, POST | List (masked) / create API credentials |
| `/api/settings/credentials/[id]` | PATCH, DELETE, POST | Update / delete / test-connection for a credential |
| `/api/sync` | POST | Trigger full manual sync across all providers |

---

## Security

**No plaintext API keys.** All external API credentials (VSA X, Datto) are stored AES-256-GCM encrypted in PostgreSQL.

- **Encryption format** — `base64(iv):base64(authTag):base64(ciphertext)` per field
- **Master key** — Only `ENCRYPTION_MASTER_KEY` (32-byte hex) is stored in `.env.local`. All other secrets are encrypted at rest in the database.
- **UI masking** — API keys always displayed as `****...last4` in the Settings UI
- **Session protection** — All API routes validate the NextAuth JWT session before processing

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | Yes | Application base URL (`http://localhost:3000` for local dev) |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT signing secret |
| `ENCRYPTION_MASTER_KEY` | Yes | 32-byte hex key for AES-256-GCM |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_EMAIL` | Seed only | Initial admin user email |
| `ADMIN_PASSWORD` | Seed only | Initial admin user password |

---

## Phase 1 Scope

The following are intentionally deferred to future phases:

- Ticketing integration
- Role-based access control (admin vs. read-only)
- SSO/OIDC/SAML
- Webhook listeners (polling only)
- Email/Slack notifications
- Dark mode
