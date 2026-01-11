# Simple POS (Next.js + SQLite)

This is a small POS system where you can:

- Maintain **reference tables** (Units of measurement)
- Declare **products** (with unit cost + unit sale price)
- Record **stock adjustments**
- Record **sales** (auto-decrements stock) and track **profits**
- Query sales with date/product filters

## Tech

- Next.js App Router (server actions)
- SQLite-compatible database via `@libsql/client`
  - Local dev defaults to a file database: `file:./pos.db`
  - On Vercel you should use a hosted SQLite/libSQL provider (e.g. Turso)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

1. Create a hosted SQLite/libSQL database (Turso is a common option).
2. In Vercel project settings, set:
   - `DATABASE_URL`
   - `DATABASE_AUTH_TOKEN` (if required by your provider)
3. Deploy.

On first run, the app will create the required tables automatically.

