import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireNumber } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.hmIngredientComponent.findMany()
    res.json(items)
  }, 'Failed to fetch hm ingredient components'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.hmIngredientComponent.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch hm ingredient component'),
)

router.get(
  '/by-hm/:id',
  asyncHandler(async (req, res) => {
    const hmIngredientId = Number(req.params.id)
    const rows = await prisma.hmIngredientComponent.findMany({
      where: { hmIngredientId },
      include: { ingredient: true },
    })

    const mapped = rows.map((r) => ({
      unit: r.ingredient.unit,
      name: r.ingredient.name,
      cost: r.ingredient.cost,
      hm_ingredient_component_id: r.id,
      ingredient_id: r.ingredientId,
      quantity: r.quantity,
    }))

    res.json(mapped)
  }, 'Failed to fetch components for hm ingredient'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const hmIngredientId = requireNumber(req.body, 'hm_ingredient_id')
    const ingredientId = requireNumber(req.body, 'ingredient_id')
    const { quantity } = req.body
    const created = await prisma.hmIngredientComponent.create({
      data: {
        hmIngredientId,
        ingredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create hm ingredient component'),
)

router.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : []
    if (rows.length === 0) return res.json({ rowsInserted: 0 })

    const hmIngredientId = Number(rows[0].hm_ingredient_id)
    const ingredientIds = rows.map((r) => Number(r.ingredient_id))

    await prisma.$transaction(async (tx) => {
      await tx.hmIngredientComponent.deleteMany({
        where: {
          hmIngredientId,
          ingredientId: { notIn: ingredientIds },
        },
      })

      await Promise.all(
        rows.map((row) =>
          tx.hmIngredientComponent.upsert({
            where: {
              hmIngredientId_ingredientId: {
                hmIngredientId: Number(row.hm_ingredient_id),
                ingredientId: Number(row.ingredient_id),
              },
            },
            update: { quantity: Number(row.selected_quantity || 0) },
            create: {
              hmIngredientId: Number(row.hm_ingredient_id),
              ingredientId: Number(row.ingredient_id),
              quantity: Number(row.selected_quantity || 0),
            },
          }),
        ),
      )
    })

    res.json({ rowsInserted: rows.length })
  }, 'Failed to bulk upsert hm ingredient components'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const hmIngredientId = requireNumber(req.body, 'hm_ingredient_id')
    const ingredientId = requireNumber(req.body, 'ingredient_id')
    const { quantity } = req.body
    const updated = await prisma.hmIngredientComponent.update({
      where: { id },
      data: {
        hmIngredientId,
        ingredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.json(updated)
  }, 'Failed to update hm ingredient component'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.hmIngredientComponent.delete({ where: { id } })
    res.status(204).end()
  }, 'Failed to delete hm ingredient component'),
)

export default router
