# sunCRM (web)

SUNation Energy ERP — sales, service, operations, HR, and finance for a
solar company. Replaces Salesforce. Built on Supabase.

## Stack

- Vite + React 18 + TypeScript
- Tailwind (with sunCRM design tokens — see `src/theme/tokens.ts`)
- @supabase/supabase-js
- React Router 7
- Recharts
- Code-split via `React.lazy` for fast first paint at scale

Companion mobile app (Expo + React Native) lives in `../mobile/`. Same
Supabase backend, same auth, same brand identity.

## Run locally

```bash
cp .env.example .env       # then fill in real values
npm install
npm run dev                # http://localhost:5173
```

## Build

```bash
npm run build              # outputs dist/
```

## Deploy

Configured for Netlify (`netlify.toml` + `public/_redirects`).

1. Push this directory to a Git repo.
2. Netlify → "Add new site" → "Import from Git" → pick the repo.
3. Build settings auto-detect from `netlify.toml`. No changes needed.
4. Site Settings → Environment Variables → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.
6. After first deploy, add the Netlify URL to **Supabase → Authentication
   → URL Configuration → Redirect URLs** so login redirects work.

## Scripts

- `scripts/bulk-create-users.mjs` — bulk-create employees from
  `employees-to-import.json`. Requires `SUPABASE_SERVICE_ROLE_KEY` env var.
  See top of file for details.
- `scripts/check-user-roles.mjs` — sanity probe for the `user_roles` table.

## Documentation

- [`../STATUS.md`](../STATUS.md) — full project status
- [`../docs/SCALE-AUDIT.md`](../docs/SCALE-AUDIT.md) — index recommendations + pooling
- [`../docs/PROCUREMENT-PLAN.md`](../docs/PROCUREMENT-PLAN.md) — parked Excel→Supabase plan
