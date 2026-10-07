# Deploying to Vercel (free)

An alternative to the Docker/GCP deployment ([DEPLOYMENT.md](DEPLOYMENT.md)) that runs on
Vercel's free Hobby tier with no monthly cost (no external-IP charge). The same codebase runs
both ways — the Express API is served as a single Vercel serverless function, and Postgres moves
to a managed provider (Neon).

**Status:** wiring is in place. The repo uses Vercel's **multi-service** layout (`vercel.json`
`services`): the Vite frontend and the Express backend deploy as two services in one project,
each built from its own folder. What's left is account setup — a Neon database and a Vercel
project — which only you can do.

## What runs where

| Piece               | On Vercel                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend (Vue/Vite) | The **`app`** service (root `.`, Vite) — static build served by Vercel's CDN                                                                                                            |
| API (Express)       | The **`backend`** service (root `backend`, Express) — built from `backend/package.json` (`prisma generate` runs on install); `/api/*` is routed here by the `rewrites` in `vercel.json` |
| Database            | **Neon** (managed Postgres, free) — Prisma connects via Neon's **pooled** URL                                                                                                           |
| Auth                | Vercel Edge Middleware (`middleware.js`) does Basic Auth over the whole site; no-op unless the env vars are set                                                                         |
| Image uploads       | ⚠️ **Not persistent yet** — serverless has no disk. Currently unused (recipes use generated placeholders). Real uploads need object storage (e.g. Vercel Blob); deferred.               |

## 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) (free), create a project in a region near you.
2. From the dashboard, grab **two** connection strings:
   - **Pooled** (has `-pooler` in the host) — this is your `DATABASE_URL` for the app.
   - **Direct** (no `-pooler`) — used once for migrating/importing data.

## 2. Load the schema + data into Neon

Dump your current production data from the GCP VM and restore it to Neon (run on the VM, or
anywhere with the dump + `psql`):

```bash
# On the GCP VM — dump schema + data (portable, no ownership)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres --no-owner --no-acl liquid_assets > liquid_assets.sql

# Restore into Neon using the DIRECT url (recreates tables, data, and Prisma's
# migration history — so the app just works, no separate migrate step needed)
psql "postgresql://<user>:<pass>@<direct-host>/<db>?sslmode=require" < liquid_assets.sql
```

(If you'd rather start fresh instead of importing: `cd backend && DATABASE_URL="<direct-url>" npx prisma migrate deploy` then `npm run seed`.)

## 3. Create the Vercel project

1. Sign up at [vercel.com](https://vercel.com) (free Hobby), **Add New → Project**, import the
   GitHub repo `Xerozzz/Liquid-Assets`.
2. Vercel reads the **`services`** block in `vercel.json` and builds each service independently
   (the `app` service with Vite, the `backend` service with Express — `prisma generate` runs via
   the backend's `postinstall`). Leave the build settings on their defaults.
3. Add **Environment Variables** (Production + Preview):

   | Name                  | Value                                                                          |
   | --------------------- | ------------------------------------------------------------------------------ |
   | `DATABASE_URL`        | Neon **pooled** connection string (with `-pooler`), include `?sslmode=require` |
   | `BASIC_AUTH_USER`     | a username                                                                     |
   | `BASIC_AUTH_PASSWORD` | a real password                                                                |
   | `GEMINI_API_KEY`      | optional — only if you want the chatbot                                        |

   **Do NOT set `VITE_API_URL`** — leaving it blank makes the frontend call `/api` same-origin
   (which is what we want; an absolute URL would bypass the Basic Auth middleware). `VERCEL` is set
   automatically by the platform.

4. **Deploy.** To test before touching `main`, push the `vercel-migration` branch — Vercel builds a
   **preview URL** for it. Verify there, then merge to `main` for the production domain.

## 4. Verify

- Visit the deployment URL → browser prompts for the Basic Auth user/password → app loads.
- `https://<your-app>.vercel.app/api/health` → `{"status":"ok","db":"ok"}` (auth-exempt, confirms
  the function reached Neon).
- Click around — the cocktail list, a recipe, Surprise Me.

## Known first-deploy gotchas

- **Prisma query engine not found** — if the function errors on a DB call, the Lambda engine
  wasn't bundled. The `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in `schema.prisma` plus
  `prisma generate` in `vercel-build` should cover it; if not, it's a `vercel.json`
  `functions.includeFiles` tweak.
- **Edge Middleware auth** — if the 401 prompt doesn't appear, confirm `BASIC_AUTH_USER/PASSWORD`
  are set in Vercel; the middleware is a no-op without them.
- **Too many DB connections** — make sure `DATABASE_URL` is Neon's **pooled** string, not the
  direct one.

## What you keep / lose vs. GCP

- **Keep:** push-to-deploy (now Vercel's native Git integration — no GitHub Actions/GHCR needed),
  HTTPS, Basic Auth, the whole app.
- **Lose / defer:** the Docker setup, your backup/monitoring cron (Neon has its own backups;
  re-point UptimeRobot at the Vercel `/api/health`), and persistent image uploads (until object
  storage is added).
- **Gain:** $0, no VM to babysit, no external-IP charge.
