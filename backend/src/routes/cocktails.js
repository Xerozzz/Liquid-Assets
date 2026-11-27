import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireString, requireNumber } from '../validate.js'
import { importCocktail, computeRecipeCost } from '../services/cocktails.js'

const router = express.Router()

// Margin % for sorting (mirrors the frontend card). Unpriced recipes return null.
function marginPercent(row) {
  if (!(row.sale_price > 0)) return null
  return ((row.sale_price - (row.total_cost || 0)) / row.sale_price) * 100
}

// Sort a mapped-rows array in place by one of the list page's sort keys. Cost, margin
// and missing-count are computed values (not DB columns), so sorting happens here in JS
// rather than via SQL ORDER BY.
function sortRows(rows, sort) {
  switch (sort) {
    case 'name_desc':
      return rows.sort((a, b) => b.name.localeCompare(a.name))
    case 'cost_asc':
      return rows.sort((a, b) => (a.total_cost || 0) - (b.total_cost || 0))
    case 'cost_desc':
      return rows.sort((a, b) => (b.total_cost || 0) - (a.total_cost || 0))
    case 'missing_desc':
      return rows.sort((a, b) => (b.missing_count || 0) - (a.missing_count || 0))
    case 'margin_asc':
    case 'margin_desc': {
      // Priced recipes sorted by margin %, unpriced ones appended at the end.
      const priced = rows.filter((c) => c.sale_price > 0)
      const unpriced = rows.filter((c) => !(c.sale_price > 0))
      priced.sort((a, b) => {
        const diff = marginPercent(a) - marginPercent(b)
        return sort === 'margin_asc' ? diff : -diff
      })
      return [...priced, ...unpriced]
    }
    default:
      return rows.sort((a, b) => a.name.localeCompare(b.name))
  }
}

function mapRow(r) {
  const { totalCost, missingCount } = computeRecipeCost(r)
  return {
    recipe_id: r.id,
    name: r.name,
    glass_id: r.glassId,
    step_to_make: r.stepToMake,
    garnish: r.garnish,
    notes: r.notes,
    image: r.image,
    created_at: r.createdAt,
    missing_count: missingCount,
    total_cost: totalCost,
    sale_price: r.salePrice,
    is_mocktail: r.isMocktail,
    raw_ingredients_str: (r.ingredients || [])
      .map((ri) => ri.ingredient?.name)
      .filter(Boolean)
      .join(', '),
    hm_ingredients_str: (r.hmIngredients || [])
      .map((hi) => hi.hmIngredient?.name)
      .filter(Boolean)
      .join(', '),
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, q, ingredient, stock_only, sort, page, limit, all, random } = req.query

    const where = { isDeleted: false }
    if (type === 'cocktail') where.isMocktail = false
    if (type === 'mocktail') where.isMocktail = true

    // Pagination is opt-in: the list page sends page/limit (or all/random), while the
    // other callers (home stats, restock, prev/next nav) still get a plain array of every
    // matching recipe. Only in paginated mode do the search/sort/filter params apply, and
    // only then does the response become an { rows, total, ... } envelope.
    const paginated =
      page !== undefined || limit !== undefined || all !== undefined || random !== undefined

    if (!paginated) {
      const recipes = await prisma.recipe.findMany({
        where,
        include: {
          ingredients: { include: { ingredient: true } },
          hmIngredients: { include: { hmIngredient: true } },
        },
      })
      return res.json(recipes.map(mapRow))
    }

    // Narrow at the DB where we can (name + ingredient name), so the set we load and
    // cost-compute in JS is already trimmed for text searches.
    if (q) where.name = { contains: String(q), mode: 'insensitive' }
    if (ingredient) {
      const needle = String(ingredient)
      where.OR = [
        {
          ingredients: {
            some: { ingredient: { name: { contains: needle, mode: 'insensitive' } } },
          },
        },
        {
          hmIngredients: {
            some: { hmIngredient: { name: { contains: needle, mode: 'insensitive' } } },
          },
        },
      ]
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })

    let rows = recipes.map(mapRow)

    // Stock filter depends on the computed missing_count, so it's applied after mapping.
    if (stock_only === '1' || stock_only === 'true') {
      rows = rows.filter((r) => r.missing_count === 0)
    }

    rows = sortRows(rows, sort)

    const total = rows.length

    // Surprise Me: one random recipe from the (filtered) set, respecting the active filters.
    if (random !== undefined) {
      const pick = total > 0 ? rows[Math.floor(Math.random() * total)] : null
      return res.json({ rows: pick ? [pick] : [], total })
    }

    // CSV export wants the whole filtered set, unpaged.
    if (all !== undefined) {
      return res.json({ rows, total, page: 1, page_size: total })
    }

    const pageNum = Math.max(1, Number(page) || 1)
    const pageSize = Math.min(200, Math.max(1, Number(limit) || 24))
    const start = (pageNum - 1) * pageSize
    const pageRows = rows.slice(start, start + pageSize)

    res.json({ rows: pageRows, total, page: pageNum, page_size: pageSize })
  }, 'Failed to fetch cocktails'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const recipeId = Number(req.params.id)
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, isDeleted: false },
      include: {
        glass: true,
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })

    if (!recipe) return res.status(404).json({ error: 'Not found' })

    const base = {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      glass_id: recipe.glassId,
      glass_name: recipe.glass?.name || '',
      glass_volume: recipe.glass?.volume ?? null,
      garnish: recipe.garnish,
      notes: recipe.notes,
      image: recipe.image,
      step_to_make: recipe.stepToMake,
      sale_price: recipe.salePrice,
      is_mocktail: recipe.isMocktail,
    }

    const items = [
      ...recipe.ingredients.map((ri) => ({
        kind: 'ingredient',
        item_id: ri.ingredientId,
        item_name: ri.ingredient?.name,
        item_cost: ri.ingredient?.cost,
        item_unit: ri.ingredient?.unit,
        item_stock: ri.ingredient?.isStocked,
        item_quantity: ri.quantity,
      })),
      ...recipe.hmIngredients.map((rh) => ({
        kind: 'hm',
        item_id: rh.hmIngredientId,
        item_name: rh.hmIngredient?.name,
        item_cost: rh.hmIngredient?.cost,
        item_unit: rh.hmIngredient?.unit,
        item_stock: rh.hmIngredient?.isStocked,
        item_quantity: rh.quantity,
      })),
    ].sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''))

    if (items.length === 0) return res.json([{ ...base }])

    res.json(items.map((it) => ({ ...base, ...it })))
  }, 'Failed to fetch cocktail details'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = requireString(req.body, 'name')
    const glassId = requireNumber(req.body, 'glass_id')
    const stepToMake = requireString(req.body, 'step_to_make')
    const { garnish, notes, image, sale_price, is_mocktail } = req.body
    const created = await prisma.recipe.create({
      data: {
        name,
        glassId,
        stepToMake,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
        salePrice: sale_price != null && sale_price !== '' ? Number(sale_price) : null,
        isMocktail: Boolean(is_mocktail),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create cocktail'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const name = requireString(req.body, 'name')
    const glassId = requireNumber(req.body, 'glass_id')
    const stepToMake = requireString(req.body, 'step_to_make')
    const { garnish, notes, image, sale_price, is_mocktail } = req.body
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        glassId,
        stepToMake,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
        salePrice: sale_price != null && sale_price !== '' ? Number(sale_price) : null,
        isMocktail: Boolean(is_mocktail),
      },
    })
    res.json(updated)
  }, 'Failed to update cocktail'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.recipe.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    res.status(204).end()
  }, 'Failed to delete cocktail'),
)

router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const { cocktail } = req.body
    if (!cocktail?.name) return res.status(400).json({ error: 'Missing cocktail data' })

    const result = await importCocktail(cocktail)
    res.json(result)
  }, 'Failed to import cocktail'),
)

export default router
