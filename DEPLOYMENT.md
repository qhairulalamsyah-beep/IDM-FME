# IDM-FME Deployment Guide

This guide covers deploying the IDM-FME (IDOL META Tournament) application to **Vercel** with **Supabase** as the production database.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A **GitHub** account with the IDM-FME repository pushed
- A **Supabase** account (free tier works)
- A **Vercel** account (hobby tier works)
- Node.js 18+ installed locally (for building/testing)

---

## Supabase Setup

The Supabase database already has all tables created via SQL scripts. You only need to verify a few things:

### 1. Verify Tables Exist

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected tables: `User`, `Tournament`, `Registration`, `Team`, `TeamMember`, `Match`, `Ranking`, `Donation`, `Sawer`, `Club`, `Settings`, `ActivityLog`, `PlayerMatchStat`, `BotLog`, `WhatsAppSettings`

### 2. Storage Buckets

Go to **Supabase Dashboard → Storage** and ensure these buckets exist:

| Bucket | Purpose |
|--------|---------|
| `avatars` | Player avatar images |
| `payment-proofs` | Donation/sawer payment proof images |
| `club-logos` | Club logo images |

If any bucket is missing, create it and set its policy to **public** (for avatars/logos) or **authenticated** (for payment proofs).

### 3. Realtime (Optional)

If you plan to use Supabase Realtime for live features:

1. Go to **Database → Replication**
2. Enable Realtime for the `Sawer` table (for live sawer updates)
3. Enable Realtime for the `Match` table (for live score updates)

### 4. Connection Strings

You need two connection strings from **Supabase Dashboard → Settings → Database**:

- **Connection string (URI)** — for pooled connections (port 6543, via Supavisor)
- **Direct connection (URI)** — for migrations and direct access (port 5432, direct to DB)

> **Important:** For the pooled URL, use the format:
> `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## Vercel Deployment

### Method 1: Connect GitHub Repository (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New Project"**
3. Import your GitHub repository (`IDM-FME` or your fork)
4. Configure the project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `.` (root)
   - **Build Command:** (leave default — Vercel will use `vercel.json`)
   - **Node.js Version:** 18.x or 20.x
5. Click **"Deploy"** (it will fail on first try without env vars — that's OK)

### Method 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Environment Variables

After creating the project in Vercel, go to **Settings → Environment Variables** and add all variables from `.env.production.example`.

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_DATABASE_URL` | Supabase direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Strong random secret for JWT tokens (min 32 chars) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `IDOL META Tournament` | App display name |
| `NEXT_PUBLIC_APP_URL` | Auto-detected | Public app URL |
| `SUPABASE_AVATAR_BUCKET` | `avatars` | Storage bucket for avatars |
| `SUPABASE_PROOF_BUCKET` | `payment-proofs` | Storage bucket for payment proofs |
| `SUPABASE_LOGO_BUCKET` | `club-logos` | Storage bucket for club logos |
| `LOG_LEVEL` | `info` | Logging level |
| `LOG_FORMAT` | `json` | Log format (json/pretty) |

### Setting Variables

1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**
2. Add each variable with its value
3. Select environments: **Production**, **Preview**, **Development** as appropriate
4. Click **Save**
5. **Redeploy** the project for changes to take effect

### Generating JWT_SECRET

```bash
openssl rand -base64 32
```

---

## Database Migrations

The Supabase database already has all tables created. However, if you need to apply schema changes in the future:

### Using Prisma Migrate (Production)

```bash
# Generate migration SQL from your local schema
npx prisma migrate diff --from-schema-datamodel prisma/schema.production.prisma \
  --to-schema-datamodel prisma/schema.production.prisma \
  --script

# Apply the SQL directly in Supabase SQL Editor
```

### Using Prisma Studio (Inspect Production Data)

```bash
# Connect to production database
npx prisma studio --browser none

# Or with the production schema
DATABASE_URL="your-direct-url" npx prisma db pull --schema=prisma/schema.production.prisma
```

> **Warning:** Never run `prisma db push` or `prisma migrate reset` against the production database!

---

## Post-Deployment Verification

### 1. Check Build Logs

Go to **Vercel Dashboard → Deployments → Latest** and verify:
- No build errors
- `prisma generate` completed successfully
- `next build` completed successfully

### 2. Test API Endpoints

```bash
# Health check
curl https://your-domain.vercel.app/api/users

# Check tournament data
curl https://your-domain.vercel.app/api/tournaments

# Check clubs
curl https://your-domain.vercel.app/api/clubs
```

### 3. Verify PWA

- Visit the deployed URL in Chrome
- Open DevTools → Application → Manifest
- Verify `manifest.json` loads correctly
- Check that the service worker (`sw.js`) registers

### 4. Test Admin Login

- Navigate to the admin panel
- Try logging in with your super_admin credentials
- Verify JWT tokens are being issued correctly

---

## Troubleshooting

### Build Fails with Prisma Error

```
Error: Prisma Client could not be generated
```

**Solution:** Verify `DATABASE_URL` is set correctly in Vercel. Even though Prisma Generate doesn't need a live connection, having the env var present prevents schema validation errors.

### Runtime Error: "Invalid prisma.xxx() call"

**Solution:** The build command in `vercel.json` generates the Prisma client using the production schema. If you see this error, the build may have used the wrong schema. Check the build logs for the `prisma generate` command output.

### Database Connection Timeout

```
Error: P1001: Can't reach database server
```

**Solution:**
1. Verify `DATABASE_URL` uses the pooled connection (port 6543)
2. Verify `DIRECT_DATABASE_URL` uses the direct connection (port 5432)
3. Check Supabase dashboard for database status

### CORS Errors with Supabase Storage

**Solution:**
1. Go to **Supabase Dashboard → Storage → Policies**
2. Ensure buckets have appropriate RLS policies (SELECT for public buckets)

### Service Worker Not Updating

**Solution:** The `sw.js` file has `Cache-Control: no-cache` set in `vercel.json`. If users report stale service workers, they may need to clear browser cache or do a hard refresh.

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Browser   │────▶│   Vercel    │────▶│    Supabase     │
│   (PWA)     │◀────│  (Next.js)  │◀────│   PostgreSQL    │
└─────────────┘     └─────────────┘     └─────────────────┘
                          │                     │
                          ▼                     ▼
                    ┌───────────┐        ┌───────────┐
                    │   Pusher  │        │  Storage  │
                    │ (Realtime)│        │ (Images)  │
                    └───────────┘        └───────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Local dev schema (SQLite) |
| `prisma/schema.production.prisma` | Production schema (PostgreSQL) |
| `vercel.json` | Vercel build config + security headers |
| `.env.production.example` | Template for production env vars |

### How Schema Switching Works

- **Local development:** Uses `prisma/schema.prisma` (SQLite) with `DATABASE_URL=file:./db/custom.db`
- **Vercel production:** Build command uses `--schema=prisma/schema.production.prisma` (PostgreSQL)
- Both schemas have identical models — only the `datasource` block differs
