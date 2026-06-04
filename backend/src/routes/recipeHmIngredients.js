import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await prisma.recipeHmIngredient.findMany()
    res.json(items)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch recipe hm ingredients' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const item = await prisma.recipeHmIngredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch recipe hm ingredient' })
  }
})

router.get('/by-recipe/:id', async (req, res) => {
  try {
    const recipeId = Number(req.params.id)
    const rows = await prisma.recipeHmIngredient.findMany({
      where: { recipeId },
      include: { hmIngredient: true },
    })

    const mapped = rows.map((r) => ({
      recipe_id: r.recipeId,
      recipe_hm_ingredient_id: r.id,
      hm_ingredient_id: r.hmIngredientId,
      name: r.hmIngredient.name,
      quantity: r.quantity,
      unit: r.hmIngredient.unit,
    }))

    res.json(mapped)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch recipe hm ingredients for recipe' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { recipe_id, hm_ingredient_id, quantity } = req.body
    const created = await prisma.recipeHmIngredient.create({
      data: {
        recipeId: Number(recipe_id),
        hmIngredientId: Number(hm_ingredient_id),
        quantity: Number(quantity || 0),
      },
    })
    res.status(201).json(created)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create recipe hm ingredient' })
  }
})

router.post('/bulk', async (req, res) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : []
    if (rows.length === 0) return res.json({ rowsInserted: 0 })

    const recipeId = Number(rows[0].recipe_id)
    const hmIngredientIds = rows.map((r) => Number(r.hm_ingredient_id))

    await prisma.$transaction(async (tx) => {
      await tx.recipeHmIngredient.deleteMany({
        where: { recipeId, hmIngredientId: { notIn: hmIngredientIds } },
      })

      for (const row of rows) {
        await tx.recipeHmIngredient.upsert({
          where: {
            recipeId_hmIngredientId: {
              recipeId: Number(row.recipe_id),
              hmIngredientId: Number(row.hm_ingredient_id),
            },
          },
          update: { quantity: Number(row.selected_quantity || 0) },
          create: {
            recipeId: Number(row.recipe_id),
            hmIngredientId: Number(row.hm_ingredient_id),
            quantity: Number(row.selected_quantity || 0),
          },
        })
      }
    })

    res.json({ rowsInserted: rows.length })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to bulk upsert recipe hm ingredients' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { recipe_id, hm_ingredient_id, quantity } = req.body
    const updated = await prisma.recipeHmIngredient.update({
      where: { id },
      data: {
        recipeId: Number(recipe_id),
        hmIngredientId: Number(hm_ingredient_id),
        quantity: Number(quantity || 0),
      },
    })
    res.json(updated)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update recipe hm ingredient' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.recipeHmIngredient.delete({ where: { id } })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete recipe hm ingredient' })
  }
})

router.delete('/by-recipe/:id', async (req, res) => {
  try {
    const recipeId = Number(req.params.id)
    await prisma.recipeHmIngredient.updateMany({
      where: { recipeId },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete recipe hm ingredients by recipe' })
  }
})

export default router
