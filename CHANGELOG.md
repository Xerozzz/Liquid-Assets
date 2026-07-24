# Changelog

Notable feature work on this app, kept here because commit history alone (`git log`) doesn't
capture _why_ — see [AGENTS.md](AGENTS.md) for conventions and [docs/API.md](docs/API.md) for the
endpoint reference. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); dates
are when the work was done, not necessarily committed.

## Unreleased

### Added

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
