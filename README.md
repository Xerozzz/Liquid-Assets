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

## App Layout

- Entry: [src/main.js](src/main.js)
- Routing: [src/router/index.js](src/router/index.js) (home, cocktails, ingredients, homemade ingredients, glassware, playground)
- Views: [src/views](src/views) with nested feature components under [src/components](src/components)
- Utilities/config: [src/composables](src/composables), [src/config](src/config), [src/utils](src/utils)

## Notes

- UI theme is configured via PrimeVue Aura in [src/main.js](src/main.js). Adjust Tailwind styles in [src/index.css](src/index.css) and [src/assets/main.css](src/assets/main.css).
- If docs generation slows `npm run dev`, run `npm run docs` once and use `vite` directly for local hacking.

Note: README written by GPT5.1
