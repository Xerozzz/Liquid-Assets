import express from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        r.*,
        (
          SELECT COUNT(*)
          FROM recipe_ingredient ri
          JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
          WHERE ri.recipe_id = r.recipe_id AND (i.is_stocked = false OR i.is_stocked IS NULL) AND ri.is_deleted = false
        ) + (
          SELECT COUNT(*)
          FROM recipe_hm_ingredient rhi
          JOIN hm_ingredients hmi ON rhi.hm_ingredient_id = hmi.hm_ingredient_id
          WHERE rhi.recipe_id = r.recipe_id AND (hmi.is_stocked = false OR hmi.is_stocked IS NULL) AND rhi.is_deleted = false
        ) AS missing_count,
        (
          SELECT STRING_AGG(i.name, ', ')
          FROM recipe_ingredient ri
          JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
          WHERE ri.recipe_id = r.recipe_id AND ri.is_deleted = false
        ) AS raw_ingredients_str,
        (
          SELECT STRING_AGG(hmi.name, ', ')
          FROM recipe_hm_ingredient rhi
          JOIN hm_ingredients hmi ON rhi.hm_ingredient_id = hmi.hm_ingredient_id
          WHERE rhi.recipe_id = r.recipe_id AND rhi.is_deleted = false
        ) AS hm_ingredients_str
      FROM recipe r
      WHERE r.is_deleted = false;
    `)
    res.json(rows)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch cocktails' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const recipeId = Number(req.params.id)
    const rows = await prisma.$queryRaw(Prisma.sql`
      WITH base AS (
        SELECT r.recipe_id,
               r.name AS recipe_name,
               g.name AS glass_name,
               g.glass_id AS glass_id,
               r.garnish,
               r.notes,
               r.image,
               r.step_to_make
        FROM recipe r
        JOIN glassware g ON r.glass_id = g.glass_id
        WHERE r.is_deleted = false AND r.recipe_id = ${recipeId}
      ),
      items AS (
        SELECT 'ingredient' AS kind,
               i.ingredient_id AS item_id,
               i.name AS item_name,
               i.cost AS item_cost,
               i.unit AS item_unit,
               i.is_stocked AS item_stock,
               ri.quantity AS item_quantity
        FROM recipe_ingredient ri
        JOIN ingredients i ON i.ingredient_id = ri.ingredient_id
        WHERE ri.is_deleted = false AND ri.recipe_id = ${recipeId}

        UNION ALL

        SELECT 'hm' AS kind,
               hmi.hm_ingredient_id AS item_id,
               hmi.name AS item_name,
               hmi.cost AS item_cost,
               hmi.unit AS item_unit,
               hmi.is_stocked AS item_stock,
               rhi.quantity AS item_quantity
        FROM recipe_hm_ingredient rhi
        JOIN hm_ingredients hmi ON hmi.hm_ingredient_id = rhi.hm_ingredient_id
        WHERE rhi.is_deleted = false AND rhi.recipe_id = ${recipeId}
      )
      SELECT b.*, i.*
      FROM base b
      CROSS JOIN items i
      ORDER BY i.item_name;
    `)

    res.json(rows)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch cocktail details' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, glass_id, step_to_make, garnish, notes, image } = req.body
    const created = await prisma.recipe.create({
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create cocktail' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, glass_id, step_to_make, garnish, notes, image } = req.body
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
      },
    })
    res.json(updated)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update cocktail' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.recipe.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete cocktail' })
  }
})

router.post('/import', async (req, res) => {
  try {
    const { cocktail } = req.body
    if (!cocktail?.name) return res.status(400).json({ error: 'Missing cocktail data' })

    const existing = await prisma.recipe.findFirst({
      where: { name: { equals: cocktail.name, mode: 'insensitive' }, isDeleted: false },
    })

    if (existing) {
      return res.json({
        success: false,
        name: cocktail.name,
        error: 'Duplicate cocktail already exists',
      })
    }

    let glass = null
    if (cocktail.glassName) {
      glass = await prisma.glassware.findFirst({
        where: { name: { equals: cocktail.glassName, mode: 'insensitive' } },
      })
    }

    if (!glass) {
      glass = await prisma.glassware.findFirst()
    }

    if (!glass) {
      glass = await prisma.glassware.create({
        data: {
          name: 'Standard Glass',
          brand: 'Generic',
          model: 'Standard',
          volume: 300,
          volumeWIce: 200,
        },
      })
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: cocktail.name,
        glassId: glass.id,
        stepToMake: cocktail.instructions || '',
        garnish: '',
        notes: '',
        image: null,
      },
    })

    const dbIngredients = await prisma.ingredient.findMany()
    const ingredientInserts = []
    const unknownIngredients = []

    for (const item of cocktail.ingredients || []) {
      const match = dbIngredients.find(
        (dbIng) => dbIng.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
      )

      if (match) {
        ingredientInserts.push({
          recipeId: recipe.id,
          ingredientId: match.id,
          quantity: Number(item.amount || 0),
        })
      } else {
        unknownIngredients.push(item.name)
      }
    }

    for (const row of ingredientInserts) {
      await prisma.recipeIngredient.create({ data: row })
    }

    res.json({ success: true, name: cocktail.name, unknowns: unknownIngredients })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to import cocktail' })
  }
})

export default router
