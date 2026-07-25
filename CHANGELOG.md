# Changelog

Notable feature work on this app, kept here because commit history alone (`git log`) doesn't
capture _why_ — see [AGENTS.md](AGENTS.md) for conventions and [docs/API.md](docs/API.md) for the
endpoint reference. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); dates
are when the work was done, not necessarily committed.

## Unreleased

### Added

- **Mocktails section** — a full separate nav section (`/mocktail`, own list/create/edit/detail
  pages) alongside Cocktails, rather than a filter on the existing list. Backed by the same
  `recipe` table (new `is_mocktail` column) and the same `/api/cocktails` endpoint (now accepts
  `?type=cocktail`/`?type=mocktail`) rather than a duplicated schema/route/service, since the two
  are structurally identical — see the "one resource, two sections" note in AGENTS.md. The
  frontend components were renamed and made category-aware instead of forked:
  `src/components/cocktails/Cocktail{Home,Create,Edit,Specific}.vue` →
  `src/components/recipes/Recipe{Home,Create,Edit,Specific}.vue`, reused by both `/cocktail` and
  `/mocktail` route trees via `route.meta.isMocktail`. `src/api/cocktail.js` similarly became
  `src/api/recipe.js`. `RestockView.vue` and the chatbot's cocktail tools now surface both
  categories (with `is_mocktail` on each item) instead of just cocktails.
- **Deployment: HTTP Basic Auth + HTTPS for a public single-user deployment.** Opt-in Basic Auth
  at the nginx layer (`docker-entrypoint.d/90-basic-auth.sh` generates the htpasswd file and an
  nginx `auth.conf` at container start from `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD`; a no-op when
  unset, so local dev is unaffected). New `docker-compose.prod.yml` adds a Caddy reverse proxy for
  automatic Let's Encrypt HTTPS given a `DOMAIN`, and keeps the app off the host's public ports
  entirely (only Caddy binds 80/443). New [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) walks through
  deploying this to a free Oracle Cloud Always Free VM with a free DuckDNS domain.
  Found along the way: the frontend's `VITE_API_URL` (when set to an absolute URL, as the old
  `.env_example` default did) makes the browser call the backend directly, bypassing nginx — and
  therefore Basic Auth — entirely; also, `docker-compose.yml`'s backend port mapping was bound to
  all interfaces (`0.0.0.0`), reachable from the network even with Basic Auth configured. Both
  fixed: `.env_example`'s `VITE_API_URL` now defaults to blank (same-origin, nginx-proxied), and
  the backend's dev port mapping is now bound to `127.0.0.1` only.
- **Automated backend tests** — a small vitest + supertest suite under `backend/test/` covering
  cost/margin computation, the hm-ingredient cost cascade fix below, and basic route validation.
  `backend/src/index.js` now exports `app` and skips `app.listen` under `NODE_ENV=test` so tests
  can drive the real Express app against the real (dockerized) Postgres without a separate test
  DB. Run via `docker compose exec backend npm test`.
- **Chatbot pricing/margin awareness** — `list_cocktails`/`get_cocktail` tools now return cost,
  sale price, and margin (via new shared `computeRecipeCost`/`computeMargin` helpers in
  `backend/src/services/cocktails.js`); `create_cocktail` accepts an optional `sale_price`; new
  `update_cocktail_price` tool sets/updates a cocktail's price by name.
- **Cocktail selling price & margin** — `sale_price` field on recipes (nullable). Create/Edit
  forms take a price; the detail page shows Cost / Sale Price / Margin ($ and %); list cards show
  a cost/price/margin badge; list view has a "Margin %" sort option.
- **Restock shortcuts** — a dedicated Restock List page (`/restock`) showing every out-of-stock
  ingredient/homemade item ranked by how many cocktails it blocks, with a one-click restock button
  and links to the affected cocktails. The same one-click toggle also lives inline on ingredient/
  homemade-ingredient list cards, and on each out-of-stock ingredient row on a cocktail's detail
  page — no need to open the full Edit form just to flip stock status.
- **Menu CSV export** — "Export Menu (CSV)" button on the cocktail list, exports the currently
  filtered/sorted view (name, cost, price, margin %, ingredients).
- **Sort controls** on all three main list views (cocktails, ingredients, homemade ingredients) —
  by name, cost, stock status, missing-ingredient count, or margin, persisted in the URL query
  string alongside the existing search/filter state.
- **Visual redesign** — replaced three uncoordinated color systems (hardcoded hex, a dead unused
  Tailwind color scale, PrimeVue's default blue theme) with one dusty-rose scale wired into both
  Tailwind (`tailwind.config.js`) and a custom PrimeVue preset (`src/theme.js`), plus a self-hosted
  Inter webfont and consistent card/detail/form styling across all four sections.
- **Mobile responsiveness pass** — fixed layouts that broke on narrow viewports across nav, list
  grids, detail pages, tables, and the chat widget.
- **In-app chatbot** (`ChatWidget.vue` + `/api/chat`) — Gemini-backed assistant with read/write
  (no delete) access to cocktails, ingredients, homemade ingredients, and glassware via an
  agentic tool-calling loop. Defaults to `gemini-flash-lite-latest` deliberately (an alias, not a
  pinned version) to avoid hardcoding a model name Google later deprecates.
- **Bulk recipe/ingredient-cost import from PDF** — one-off scripts (not part of the running app)
  used to transcribe and import ~360 cocktail recipes and ingredient cost data from source PDFs,
  creating missing ingredients as needed and merging a couple of duplicate ingredients found along
  the way (Sugar/White Sugar, Coffee Liqueur/Kahlúa).
- **Glassware simplified to 3 standard options** (Highball 320ml, Rocks Glass 300ml, Coupe 150ml);
  cocktail detail page now shows both the glass's capacity and the recipe's actual pour volume.

### Fixed

- **PrimeIcons never actually loaded** — the `primeicons` npm package was a listed dependency and
  used throughout via raw `<i class="pi pi-*">` markup (nav icons, empty/error states, `Button
icon="pi pi-*"` props), but its stylesheet was never imported anywhere, so the `@font-face` and
  glyph-content CSS rules never shipped in the build at all. Every such icon silently rendered as
  an empty box — PrimeVue's own internal chrome (dropdowns, dialogs, etc.) uses SVG icon
  components in v4 rather than the classic icon font, which is why this went unnoticed through
  every earlier visual-pass verification. Fixed with one line: `import 'primeicons/primeicons.css'`
  in `src/main.js`.
- **Stale homemade-ingredient costs**: `hm_ingredients.cost` is a stored snapshot computed when
  its components/yield were last edited — it never updated when a _component's_ raw ingredient
  cost changed afterward, silently leaving both the homemade ingredient and every cocktail using
  it costed against stale numbers. `PUT /api/ingredients/:id` now cascades a recompute to every
  homemade ingredient using that ingredient
  (`backend/src/services/hmIngredients.js`). Found live in the seeded data: Honey Syrup's stored
  cost (`$0.018472/ml`) didn't match what its current components actually cost (`$0.015/ml`).
- `src/api/recipe_ingredient.js` / `src/api/recipe_hm_ingredient.js`: `getRecipeIngredientByRecipeId`
  / `getRecipeHmIngredientByRecipeId` were running the backend's already-flattened `by-recipe/:id`
  array response through the generic single-entity mapper, which silently emptied the ingredient
  list on the Edit Cocktail page and made saving impossible whenever the "cocktail needs at least
  one ingredient" guard tripped. See the "by-recipe/:id trap" note in AGENTS.md.
- A `dashes?` regex during PDF recipe import matched "dash"/"dashes" but not the singular "dash",
  creating bogus ingredients like "dash Angostura Bitters" for "1 dash X" lines.
- Various accent/spacing transcription mismatches from PDF import (e.g. "Kahlua" vs "Kahlúa")
  that silently dropped ~59 ingredient links because matching was exact-string-only.
- `CocktailHome.vue` broken image rendering, `GET /api/cocktails/:id` 404 inconsistency, several
  silently-swallowed errors in Vue `catch` blocks, orphaned uploaded images not cleaned up on
  record delete, `deleteImage()` not checking response status.

### Removed

- Dead `recipes.js` route + `src/api/recipe.js` wrapper (unused), unused Pinia counter store and
  date-formatter util, unused `tailwind-merge` and `dotenv` dependencies.

### Changed

- Centralized backend error handling (`asyncHandler` + `ValidationError`) and input validation
  (`requireString`/`requireNumber`) across all routes, replacing ad hoc try/catch per handler.
- Batched sequential `await`s into `Promise.all` where writes were independent.
