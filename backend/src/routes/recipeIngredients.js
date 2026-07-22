import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireNumber } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.recipeIngredient.findMany()
    res.json(items)
  }, 'Failed to fetch recipe ingredients'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.recipeIngredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch recipe ingredient'),
)

router.get(
  '/by-recipe/:id',
  asyncHandler(async (req, res) => {
    const recipeId = Number(req.params.id)
    const rows = await prisma.recipeIngredient.findMany({
      where: { recipeId },
      include: { ingredient: true },
    })

    const mapped = rows.map((r) => ({
      recipe_id: r.recipeId,
      recipe_ingredient_id: r.id,
      ingredient_id: r.ingredientId,
      quantity: r.quantity,
      name: r.ingredient.name,
      unit: r.ingredient.unit,
    }))

    res.json(mapped)
  }, 'Failed to fetch recipe ingredients for recipe'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const recipeId = requireNumber(req.body, 'recipe_id')
    const ingredientId = requireNumber(req.body, 'ingredient_id')
    const { quantity } = req.body
    const created = await prisma.recipeIngredient.create({
      data: {
        recipeId,
        ingredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create recipe ingredient'),
)

router.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : []
    if (rows.length === 0) return res.json({ rowsInserted: 0 })

    const recipeId = Number(rows[0].recipe_id)
    const ingredientIds = rows.map((r) => Number(r.ingredient_id))

    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId, ingredientId: { notIn: ingredientIds } },
      })

      await Promise.all(
        rows.map((row) =>
          tx.recipeIngredient.upsert({
            where: {
              recipeId_ingredientId: {
                recipeId: Number(row.recipe_id),
                ingredientId: Number(row.ingredient_id),
              },
            },
            update: { quantity: Number(row.selected_quantity || 0) },
            create: {
              recipeId: Number(row.recipe_id),
              ingredientId: Number(row.ingredient_id),
              quantity: Number(row.selected_quantity || 0),
            },
          }),
        ),
      )
    })

    res.json({ rowsInserted: rows.length })
  }, 'Failed to bulk upsert recipe ingredients'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const recipeId = requireNumber(req.body, 'recipe_id')
    const ingredientId = requireNumber(req.body, 'ingredient_id')
    const { quantity } = req.body
    const updated = await prisma.recipeIngredient.update({
      where: { id },
      data: {
        recipeId,
        ingredientId,
        quantity: Number(quantity || 0),
      },
    })
    res.json(updated)
  }, 'Failed to update recipe ingredient'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.recipeIngredient.delete({ where: { id } })
    res.status(204).end()
  }, 'Failed to delete recipe ingredient'),
)

router.delete(
  '/by-recipe/:id',
  asyncHandler(async (req, res) => {
    const recipeId = Number(req.params.id)
    await prisma.recipeIngredient.deleteMany({ where: { recipeId } })
    res.status(204).end()
  }, 'Failed to delete recipe ingredients by recipe'),
)

export default router
