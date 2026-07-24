# AGENTS.md

Guidance for AI coding agents (and human contributors skimming for context) working in this
repo. For product/setup docs, see [README.md](README.md). This file covers conventions, gotchas,
and workflow so you don't have to re-derive them from scratch.

## What this app is

"Liquid Assets" — a cocktail costing and inventory tool. Vue 3 frontend, Express + Prisma +
Postgres backend, Docker Compose runtime. Tracks raw ingredients, homemade ingredients (syrups,
infusions, etc. built from raw ingredients), glassware, and cocktail recipes, and computes cost,
selling price/margin, and pour volume per recipe.

## Architecture at a glance

- `src/` — Vue 3 (Options API throughout — no `<script setup>` anywhere, stay consistent),
  Vue Router, Pinia, PrimeVue 4, Tailwind 4.
- `backend/src/` — Express routes, one file per resource under `backend/src/routes/`, Prisma as
  the only DB access layer (`backend/src/prisma.js`).
- `backend/prisma/schema.prisma` — source of truth for the data model.
- Nginx (`nginx.conf`) reverse-proxies `/api/*` to the backend in the Docker build, so the
  frontend and backend share one origin in production; in local dev the frontend talks to the
  backend directly via `VITE_API_URL`.

## Naming convention: snake_case over the wire, camelCase in Prisma

Prisma models use camelCase fields mapped to snake_case DB columns (`@map(...)` in
`schema.prisma`). Routes then hand-shape most responses into plain snake_case JSON to match what
the frontend expects (e.g. `backend/src/routes/cocktails.js` builds `{ recipe_id, glass_id, ... }`
objects instead of returning the Prisma object directly). A few routes return the raw Prisma
object unmodified (camelCase) — e.g. `POST/PUT /api/ingredients`, `POST/PUT /api/cocktails`. The
frontend's `src/api/mappers.js` papers over this by accepting both (`i.is_stocked ?? i.isStocked`).

**When adding a new route or frontend call, check what shape the specific endpoint actually
returns before assuming — don't assume every endpoint is symmetric.**

## The `by-recipe/:id` / `by-hm/:id` trap

Several endpoints — `GET /api/recipe-ingredients/by-recipe/:id`,
`GET /api/recipe-hm-ingredients/by-recipe/:id`, `GET /api/hm-ingredient-components/by-hm/:id` —
return a **custom flattened shape** (joined with the related ingredient's `name`/`unit`/`cost`),
not the raw join-table entity. Do not pipe these through the generic `mapRecipeIngredient` /
`mapRecipeHmIngredient` mappers in `src/api/mappers.js` — those mappers are for the raw entity
shape and will silently strip `name`/`unit` and mis-map when given an array (a single object
comes back instead of a mapped array, and downstream `.map()` calls throw). This exact bug
existed in `src/api/recipe_ingredient.js` / `src/api/recipe_hm_ingredient.js` and silently broke
the Edit Cocktail page's ingredient list (fixed 2026-07-24) — treat it as the canonical example of
what _not_ to do with these endpoints. Fetch and return the array as-is.

## Backend conventions

- Every route handler is wrapped in `asyncHandler(fn, errorMessage)`
  (`backend/src/asyncHandler.js`) — it catches errors, maps `ValidationError` to a 400 with the
  thrown message, and everything else to a 500 with the generic `errorMessage`. Always wrap new
  routes the same way; never leave a route unwrapped.
- Input validation uses `requireString(body, field)` / `requireNumber(body, field)`
  (`backend/src/validate.js`), which throw `ValidationError` on failure. Use these instead of
  hand-rolled checks.
- Soft delete (`isDeleted` / `is_deleted`) is used on the top-level entities (ingredients,
  hm_ingredients, glassware, recipe). The three join tables
  (`recipe_ingredient`, `recipe_hm_ingredient`, `hm_ingredient_components`) are **hard-deleted** —
  don't add soft-delete fields back to them (they were deliberately dropped, see migration
  `20260703120000_drop_join_softdelete`).
- Bulk upsert endpoints (`POST .../bulk` on the three join-table routers) diff-and-replace: they
  delete rows not in the incoming set, then upsert the rest inside a `prisma.$transaction`. Follow
  this pattern for any new bulk-write endpoint rather than deleting-then-recreating everything.
- `hm_ingredients.cost` is a **stored snapshot**, not computed live (unlike cocktail cost, which
  `GET /api/cocktails` always recomputes fresh from its ingredients on every request). It only
  stays accurate because `PUT /api/ingredients/:id` cascades a recompute to every homemade
  ingredient that uses that ingredient as a component
  (`recalculateHmIngredientCostsForIngredient` in `backend/src/services/hmIngredients.js`, fixed
  2026-07-24 — previously this cascade didn't exist, so editing a raw ingredient's cost silently
  left every homemade ingredient using it, and every cocktail using _that_, costed against stale
  numbers). If you add another way to change an ingredient's cost, cascade the recompute the same
  way.

## Migrations

Migrations are hand-authored SQL files under `backend/prisma/migrations/<timestamp>_<name>/migration.sql`
(there's no separate dev/shadow database in this setup — migrations are written by hand to match
`schema.prisma`, not generated via `prisma migrate dev`). Match the existing style: plain
`ALTER TABLE`/`CREATE TABLE` statements, snake_case column names matching the `@map(...)` in the
schema. They apply automatically via `prisma migrate deploy` in `backend/docker-entrypoint.sh` on
every container start — no manual step needed after `docker compose up --build`, just check the
backend logs to confirm the new migration applied.

## Frontend conventions

- Options API only, matching the rest of the codebase.
- Shared base classes in `src/assets/main.css`: `.nav_button` (button styling), `.title` (page
  heading), `.sectionbox` (card container). Use these instead of one-off Tailwind class soups on
  new pages so the look stays consistent.
- Color: use the `primary-*` Tailwind scale (`tailwind.config.js`) and the matching PrimeVue
  `RosePreset` (`src/theme.js`, wired in `src/main.js`) — never hardcode hex colors. If a PrimeVue
  component looks blue, it means the preset isn't being applied somewhere; it should never happen
  by design.
- `src/components/IngredientDatatable.vue` is the shared "pick ingredients into a recipe/homemade
  item" widget, used by both raw and homemade ingredient pickers in Create/Edit forms. It expects
  each item in `selectedIngredients` to carry `name`, `unit`, `selected_quantity` (or `quantity`
  as fallback), and either `ingredient_id` or `hm_ingredient_id`. Keep any new data feeding into it
  shaped that way.
- List pages (`*Home.vue`) follow a shared pattern: `searchQuery` + optional extra filters +
  `sortBy`/`sortOptions`, all persisted to the URL query string via `updateUrlQuery(key, value)`
  and restored on mount. Follow this pattern for new list views rather than inventing a new one.
- Quick in-place toggles (e.g. the stock-status toggle button on ingredient cards) call the
  existing full `updateX(...)` API function with all fields from the already-loaded row plus the
  one flipped field — there's no dedicated PATCH-a-single-field endpoint, so always pass the
  complete object back.

## Chatbot (`/api/chat`)

Gemini-backed agentic tool-calling loop (`backend/src/routes/chat.js`), tools declared/handled in
`backend/src/chatTools.js`, client wrapper in `src/api/chat.js`, UI in
`src/components/ChatWidget.vue`. It has read + write tools but **no delete tools by design** — if
you add tools, keep that constraint unless a human explicitly asks to change it. `GEMINI_MODEL`
defaults to `gemini-flash-lite-latest` (an alias, not a pinned version) specifically to avoid
hardcoding a model name that Google later deprecates — don't hardcode a dated model version here.

## Verifying changes

1. `npx eslint src backend/src` and `npx prettier --write` the files you touched (repo has no
   automated test suite — lint/format plus manual verification is the whole safety net).
2. `docker compose up --build -d` and check `docker compose logs backend --tail=40` for migration
   and startup errors.
3. Exercise the changed feature in the browser and check the browser console + backend logs for
   errors — there's no CI, so this is the actual verification step, not optional.
4. If you changed anything that reads/writes existing data via a browser test (e.g. toggling stock
   status, setting a price), revert the test value afterward so the seeded/imported demo data
   doesn't accumulate stray edits from verification runs.

## Where things live (quick map)

- `src/api/*.js` — one file per REST resource, thin fetch wrappers; `base.js` has the shared
  `apiUrl`/`handleResponse`; `mappers.js` has the snake_case/camelCase reconciliation.
- `src/components/<feature>/` — `*Home.vue` (list), `*Create.vue`, `*Edit.vue`, `*Specific.vue`
  (detail) per feature (cocktails, ingredients, hmIngredients, glassware).
- `src/views/` — thin router-view wrappers per top-level section, plus standalone pages like
  `HomeView.vue` and `RestockView.vue` that don't need nested routes.
- `backend/src/routes/` — one file per resource, mirrors the frontend `src/api/` split.
- `backend/src/services/cocktails.js` — shared recipe-import logic used by both the CSV import
  route and one-off data-migration scripts.
