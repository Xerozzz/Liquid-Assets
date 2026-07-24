# API Reference

Base path: `/api`. All request/response bodies are JSON. Errors are `{ "error": "message" }` with
a 400 (validation) or 500 (unexpected) status — see `asyncHandler`/`ValidationError` in
[AGENTS.md](../AGENTS.md#backend-conventions).

Two response shapes appear throughout this API — see the note at the end of this doc before
writing a new frontend call.

## Health

| Method | Path      | Notes                                |
| ------ | --------- | ------------------------------------ |
| GET    | `/health` | `{ status: 'ok' }`, not under `/api` |

## Ingredients (`/api/ingredients`)

Raw ingredients (spirits, mixers, etc). Returns the raw Prisma row (camelCase: `isStocked`,
`isDeleted`, `createdAt`, `deletedAt`).

| Method | Path   | Body                              | Notes                                  |
| ------ | ------ | --------------------------------- | -------------------------------------- |
| GET    | `/`    | —                                 | Non-deleted only                       |
| GET    | `/:id` | —                                 | 404 if missing                         |
| POST   | `/`    | `{ name, unit, cost, isStocked }` |                                        |
| PUT    | `/:id` | `{ name, unit, cost, isStocked }` | Full replace — always send every field |
| DELETE | `/:id` | —                                 | Soft delete                            |

`PUT /:id` has a side effect: it recomputes and persists the `cost` of every homemade ingredient
that uses this ingredient as a component (`recalculateHmIngredientCostsForIngredient` in
`backend/src/services/hmIngredients.js`), so homemade-ingredient (and therefore cocktail) costs
stay accurate after a raw ingredient's price changes.

## Homemade Ingredients (`/api/hm-ingredients`)

Syrups/infusions/etc built from raw ingredients. Same raw-row shape as ingredients, plus
`yieldAmount`, `notes`, `image`.

| Method | Path              | Body                                                         | Notes                          |
| ------ | ----------------- | ------------------------------------------------------------ | ------------------------------ |
| GET    | `/`               | —                                                            |                                |
| GET    | `/:id`            | —                                                            |                                |
| GET    | `/:id/components` | —                                                            | **Flattened shape**, see below |
| POST   | `/`               | `{ name, cost, notes, unit, yieldAmount, image, isStocked }` |                                |
| PUT    | `/:id`            | same as POST                                                 | Full replace                   |
| DELETE | `/:id`            | —                                                            | Soft delete                    |

## Glassware (`/api/glassware`)

| Method | Path   | Body                                   | Notes                                                  |
| ------ | ------ | -------------------------------------- | ------------------------------------------------------ |
| GET    | `/`    | —                                      |                                                        |
| GET    | `/:id` | —                                      |                                                        |
| POST   | `/`    | `{ brand, model, volume, volumeWIce }` | `name` is derived server-side as `"${brand} ${model}"` |
| PUT    | `/:id` | same as POST                           |                                                        |
| DELETE | `/:id` | —                                      | Soft delete                                            |

## Cocktails (`/api/cocktails`)

The most heavily custom-shaped resource — **neither list nor detail returns the raw Prisma row.**

- `GET /` — one row per recipe, each with computed fields: `total_cost` (sum of
  `quantity × ingredient.cost` across raw + homemade ingredients), `missing_count` (how many of its
  ingredients are out of stock), `sale_price`, and `raw_ingredients_str`/`hm_ingredients_str`
  (comma-joined ingredient names — used for the client-side ingredient filter/search and by
  `RestockView.vue` to cross-reference which cocktails an out-of-stock item blocks).
- `GET /:id` — returns an **array**, one row per ingredient in the recipe, each row spreading the
  same recipe-level fields (`recipe_name`, `glass_name`, `glass_volume`, `sale_price`, ...) plus
  per-item fields (`kind: 'ingredient' | 'hm'`, `item_id`, `item_name`, `item_cost`, `item_unit`,
  `item_stock`, `item_quantity`). If the recipe has no ingredients, returns a single-element array
  with just the recipe-level fields. Frontend cost/margin math is done client-side in
  `CocktailSpecific.vue` from these rows.
- `POST /`, `PUT /:id` — body: `{ name, glass_id, step_to_make, garnish, notes, image, sale_price }`.
  `sale_price` is optional/nullable.
- `DELETE /:id` — soft delete.
- `POST /import` — body `{ cocktail: { name, instructions, ingredients: [{name, amount}, ...] } }`.
  Used by the CSV/PDF import flows; delegates to `importCocktail()` in
  `backend/src/services/cocktails.js`. Skips (doesn't overwrite) recipes that already exist by
  case-insensitive name match, and reports any ingredient names it couldn't match in the response.

## Recipe ↔ Ingredient links (`/api/recipe-ingredients`, `/api/recipe-hm-ingredients`)

Join tables. Same shape for both (raw vs. homemade):

| Method | Path             | Notes                                                                                           |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/`              | All rows, raw entity shape                                                                      |
| GET    | `/:id`           | Raw entity shape                                                                                |
| GET    | `/by-recipe/:id` | **Flattened shape**, see below                                                                  |
| POST   | `/`              | `{ recipe_id, ingredient_id (or hm_ingredient_id), quantity }`                                  |
| POST   | `/bulk`          | Array of rows for one recipe — diff-and-replace (deletes rows not in the set, upserts the rest) |
| PUT    | `/:id`           |                                                                                                 |
| DELETE | `/:id`           |                                                                                                 |
| DELETE | `/by-recipe/:id` | Deletes all links for a recipe (used when deleting a cocktail)                                  |

## Homemade Ingredient Components (`/api/hm-ingredient-components`)

Join table linking a homemade ingredient to its raw-ingredient recipe. Same pattern as above:
`GET /by-hm/:id` returns the **flattened shape**; `POST /bulk` is diff-and-replace.

## Images (`/api/images`)

| Method | Path     | Body                    | Notes                                             |
| ------ | -------- | ----------------------- | ------------------------------------------------- |
| POST   | `/`      | multipart, field `file` | Returns `{ filename }`; stored under `UPLOAD_DIR` |
| GET    | `/:name` | —                       | Streams the file                                  |
| DELETE | `/:name` | —                       | Hard delete from disk                             |

## Chat (`/api/chat`)

| Method | Path | Body                                                  | Notes                                                                                                                                                         |
| ------ | ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/`  | `{ messages: [{ role: 'user'\|'assistant', text }] }` | Gemini agentic loop, up to 5 tool-call turns. Returns `{ reply }`. 503 if `GEMINI_API_KEY` isn't set; 400 with a friendly message on Gemini rate-limit (429). |

---

## ⚠️ Two response shapes — read before adding a frontend call

1. **Raw entity shape** (ingredients, hm-ingredients, glassware, and the generic
   `/api/recipe-ingredients`, `/api/recipe-hm-ingredients`, `/api/hm-ingredient-components` list/
   detail endpoints): mirrors the Prisma model, camelCase fields. Frontend code reconciles this via
   `src/api/mappers.js` (`?? camelCaseField` fallbacks).
2. **Flattened/custom shape** (`.../by-recipe/:id`, `.../by-hm/:id`, `/api/cocktails` list and
   detail): hand-built in the route to join in related names/units/costs and, for cocktails,
   computed totals. Already snake_case, already flat — **do not** run these through
   `mapRecipeIngredient`/`mapRecipeHmIngredient`/etc. Just return the parsed JSON as-is. Doing this
   wrong previously caused a real bug — see the "by-recipe/:id trap" section in
   [AGENTS.md](../AGENTS.md).
