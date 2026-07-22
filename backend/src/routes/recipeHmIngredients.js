import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireNumber } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.recipeHmIngredient.findMany()
    res.json(items)
  }, 'Failed to fetch recipe hm ingredients'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.recipeHmIngredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch recipe hm ingredient'),
)

router.get(
  '/by-recipe/:id',
  asyncHandler(async (req, res) => {
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
  }, 'Failed to fetch recipe hm ingredients for recipe'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const recipeId = requireNumber(req.body, 'recipe_id')
    const hmIngredientId = requireNumber(req.body, 'hm_ingredient_id')
    const { quantity } = req.body
    const created = await prisma.recipeHmIngredient.create({
      data: {
        recipeId,
        hmIngredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create recipe hm ingredient'),
)

router.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : []
    if (rows.length === 0) return res.json({ rowsInserted: 0 })

    const recipeId = Number(rows[0].recipe_id)
    const hmIngredientIds = rows.map((r) => Number(r.hm_ingredient_id))

    await prisma.$transaction(async (tx) => {
      await tx.recipeHmIngredient.deleteMany({
        where: { recipeId, hmIngredientId: { notIn: hmIngredientIds } },
      })

      await Promise.all(
        rows.map((row) =>
          tx.recipeHmIngredient.upsert({
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
          }),
        ),
      )
    })

    res.json({ rowsInserted: rows.length })
  }, 'Failed to bulk upsert recipe hm ingredients'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const recipeId = requireNumber(req.body, 'recipe_id')
    const hmIngredientId = requireNumber(req.body, 'hm_ingredient_id')
    const { quantity } = req.body
    const updated = await prisma.recipeHmIngredient.update({
      where: { id },
      data: {
        recipeId,
        hmIngredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.json(updated)
  }, 'Failed to update recipe hm ingredient'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.recipeHmIngredient.delete({ where: { id } })
    res.status(204).end()
  }, 'Failed to delete recipe hm ingredient'),
)

router.delete(
  '/by-recipe/:id',
  asyncHandler(async (req, res) => {
    const recipeId = Number(req.params.id)
    await prisma.recipeHmIngredient.deleteMany({ where: { recipeId } })
    res.status(204).end()
  }, 'Failed to delete recipe hm ingredients by recipe'),
)

export default router
