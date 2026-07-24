# Liquid Assets v1.0

Cocktail costing and inventory companion for bartenders or home enthusiasts. Track glassware, raw ingredients, homemade components, and full recipes in a Vue frontend backed by an Express + Prisma + Postgres backend, all running in Docker.

Contributing or working with an AI coding agent? See [AGENTS.md](AGENTS.md) for conventions and
gotchas, [docs/API.md](docs/API.md) for the REST endpoint reference, and
[CHANGELOG.md](CHANGELOG.md) for feature history.

## Features

- CRUD for cocktails, ingredients, homemade ingredients, and glassware with nested Vue Router views
- Automatic cost/yield calculations and stock flags to see what can be made with on-hand items
- Postgres-backed multi-user database (via Prisma), with schema migrations and seed data applied automatically on first boot
- Server-hosted image uploads persisted to a Docker volume — images follow users across devices
- PrimeVue UI with themeable components plus Pinia state and Tailwind utility styling
- Nginx reverse-proxies `/api/*` to the backend so the browser only talks to one origin

## Tech Stack

- Frontend: Vue 3 + Vite 7, Vue Router 4, Pinia 3, PrimeVue 4 (Aura), TailwindCSS 4
- Backend: Node 20 + Express 4, Prisma 5, Multer (uploads)
- Database: Postgres 15
- Runtime: Docker Compose (db + backend + frontend)

## Data Model

- `glassware`: shapes/volumes for costing and pour rules
- `ingredients`: raw items with cost per unit and stock flag
- `hm_ingredients`: homemade items with yields, cost, and notes
- `hm_ingredient_components`: maps homemade items to their raw ingredients
- `recipe`: cocktail/mocktail records with steps, garnish, and glass link
- `recipe_ingredient` / `recipe_hm_ingredient`: link recipes to raw and homemade items

Soft-delete (`is_deleted`) is used on the top-level entities; the three join tables use hard delete. Schema lives in [backend/prisma/schema.prisma](backend/prisma/schema.prisma); seed data in [backend/prisma/seed.js](backend/prisma/seed.js).

## Quick Start (Docker)

Prerequisites: Docker Desktop (with Docker Compose v2).

```sh
docker compose up --build
```

On first boot the backend runs `prisma migrate deploy` and (unless a database is already populated) seeds sample data. Then:

- Frontend: http://localhost/
- Backend health: http://localhost/api/health
- Postgres: localhost:5432 (user/password: `postgres` / `postgres`)

To stop and remove containers (data volumes preserved):

```sh
docker compose down
```

To wipe the database and uploaded images as well:

```sh
docker compose down -v
```

## Local Frontend Development (against the containerized backend)

You can point a locally-run Vite dev server at the containerized backend for hot-reload dev.

```sh
docker compose up -d db backend   # start only db + backend
npm install
VITE_API_URL=http://localhost:4000 npm run dev
```

Dev server: http://localhost:5173

Other scripts:

```sh
npm run build          # production bundle
npm run preview        # preview built app
npm run lint           # eslint --fix
npm run format         # prettier src/
npm run docs           # regenerate JSDoc
```

## Local Backend Development

```sh
docker compose up -d db
cd backend
npm install
DATABASE_URL='postgres://postgres:postgres@localhost:5432/liquid_assets' \
  npx prisma migrate deploy
DATABASE_URL='postgres://postgres:postgres@localhost:5432/liquid_assets' \
  npm run dev   # or npm start
```

## Persistence

- Postgres data lives in the `db_data` volume.
- Uploaded images live in the `images_data` volume, exposed inside the backend at `/app/uploads` and served at `/api/images/:filename`.

## App Layout

- Entry: [src/main.js](src/main.js)
- Routing: [src/router/index.js](src/router/index.js) (home, cocktails, ingredients, homemade ingredients, glassware)
- Views: [src/views](src/views) with nested feature components under [src/components](src/components)
- API wrappers: [src/api](src/api) (see [src/api/base.js](src/api/base.js) and [src/api/mappers.js](src/api/mappers.js))
- Image helpers: [src/composables/useImageStorage.js](src/composables/useImageStorage.js) → [src/api/images.js](src/api/images.js)
