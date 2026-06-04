# Liquid Assets v1.0

Cocktail costing and inventory companion for bartenders or home enthusiasts. Track glassware, raw ingredients, homemade components, and full recipes in one offline-friendly Vue app backed by a browser-hosted SQLite database.

## Features

- CRUD for cocktails, ingredients, homemade ingredients, and glassware with nested Vue Router views
- Automatic cost/yield calculations and stock flags to see what can be made with on-hand items
- Embedded SQLite (WASM + OPFS) with first-run seeding for demo data and foreign-key constraints enabled
- PrimeVue UI with themeable components plus Pinia state and Tailwind utility styling
- Playground view for running saved SQL snippets during development

## Tech Stack

- Vue 3 + Vite 7, Vue Router 4, Pinia 3
- PrimeVue 4 + Prime Icons, Aura theme, TailwindCSS 4
- SQLite WASM (`@sqlite.org/sqlite-wasm`) persisted in OPFS
- Tooling: ESLint + Prettier, JSDoc-generated docs

## Data Model (SQLite)

- `glassware`: shapes/volumes for costing and pour rules
- `ingredients`: raw items with cost per unit and stock flag
- `hm_ingredients`: homemade items with yields, cost, and notes
- `hm_ingredient_components`: maps homemade items to their raw ingredients
- `recipe`: cocktail/mocktail records with steps, garnish, and glass link
- `recipe_ingredient` and `recipe_hm_ingredient`: connect recipes to raw and homemade items

Tables, schemas, and seed inserts live in [src/config/database.js](src/config/database.js) and [src/config/dumps.js](src/config/dumps.js).

## Getting Started

Prerequisites: Node 18+.

```sh
npm install            # install deps
npm run dev            # dev server + regenerate JSDoc
npm run build          # production bundle
npm run preview        # preview built app
npm run lint           # eslint --fix
npm run format         # prettier src/
npm run docs           # regenerate docs only
```

Dev server: http://localhost:5173

Documentation: http://localhost:5173/docs/index.html (generated into public/docs by `npm run docs`).

## Database & Seeding

- SQLite runs in-browser via WASM and persists in OPFS under `mydb.sqlite3`.
- First load seeds sample data; the flag is stored in `localStorage` as `cocktail_app_db_seeded`.
- To reseed: clear that flag and the OPFS db files, or call `resetDatabase()` from [src/composables/useSQLite.js](src/composables/useSQLite.js) (which destroys the worker, removes OPFS files, and re-seeds).
- Foreign keys are enabled at init with `PRAGMA foreign_keys = ON;`.

## Running with Postgres (Docker) and the new Backend

This repository includes a proof-of-concept backend (Express + Prisma) and a Postgres service for a persistent, multi-user database. Use the instructions below to reproduce the environment used during development and to run quick smoke tests for the API.

Prerequisites: Docker (Docker Desktop) and docker compose, Node 18+ if running migrations locally.

1. Start only the Postgres service (recommended for manual migrations):

```bash
docker compose up -d db
```

2. (Optional but recommended for development) Run migrations and seed from the backend folder:

```bash
cd backend
npm install
# Set DATABASE_URL before running migrations. On Windows (PowerShell):
$env:DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/liquid_assets'
# Run the migration (this will create the schema and generate the Prisma client):
npx prisma migrate dev --name init --skip-seed
# Seed the database with sample data:
node prisma/seed.js
```

3. Build and run the backend (rebuild after local migrations so Prisma client matches DB):

```bash
docker compose up -d --build backend
```

4. Quick API smoke tests (use curl.exe on Windows to avoid PowerShell prompts):

```bash
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/api/ingredients
```

Notes and tips

- If you ran `prisma migrate` locally, rebuild the backend image so that `npx prisma generate` runs inside the image and the generated Prisma client matches the applied schema.
- The backend project is in [backend/Dockerfile](backend/Dockerfile) and the Prisma schema is in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).
- The docker-compose configuration lives in [docker-compose.yml](docker-compose.yml).
- Frontend modules that call the backend are under [src/api](src/api); see the base helper [src/api/base.js](src/api/base.js) and mapping helpers [src/api/mappers.js](src/api/mappers.js).
- The original in-browser SQLite implementation remains in [src/composables/useSQLite.js](src/composables/useSQLite.js) and can be used for offline/demo runs.

Bring the full stack up (DB + backend + frontend) with:

```bash
docker compose up --build
```

When finished, stop and remove containers:

```bash
docker compose down
```

If you want me to add a simple `make`/`ps1` helper script or expand the README with platform-specific notes, tell me which OS you'd like targeted and I'll add it.

## App Layout

- Entry: [src/main.js](src/main.js)
- Routing: [src/router/index.js](src/router/index.js) (home, cocktails, ingredients, homemade ingredients, glassware, playground)
- Views: [src/views](src/views) with nested feature components under [src/components](src/components)
- Utilities/config: [src/composables](src/composables), [src/config](src/config), [src/utils](src/utils)

## Notes

- UI theme is configured via PrimeVue Aura in [src/main.js](src/main.js). Adjust Tailwind styles in [src/index.css](src/index.css) and [src/assets/main.css](src/assets/main.css).
- If docs generation slows `npm run dev`, run `npm run docs` once and use `vite` directly for local hacking.

Note: README written by GPT5.1
