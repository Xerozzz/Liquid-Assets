import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireString } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.hmIngredient.findMany({ where: { isDeleted: false } })
    res.json(items)
  }, 'Failed to fetch hm ingredients'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.hmIngredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch hm ingredient'),
)

router.get(
  '/:id/components',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.hmIngredient.findUnique({
      where: { id },
      include: { components: { include: { ingredient: true } } },
    })

    if (!item) return res.status(404).json({ error: 'Not found' })

    const rows = (item.components.length ? item.components : [null]).map((comp) => ({
      hm_ingredient_id: item.id,
      hm_ingredient_name: item.name,
      hm_ingredient_cost: item.cost,
      hm_ingredient_image: item.image,
      hm_ingredient_unit: item.unit,
      hm_ingredient_yield: item.yieldAmount,
      hm_ingredient_notes: item.notes,
      is_stocked: item.isStocked,
      component_quantity: comp?.quantity ?? null,
      component_id: comp?.ingredient?.id ?? null,
      component_name: comp?.ingredient?.name ?? null,
      component_cost: comp?.ingredient?.cost ?? null,
      component_unit: comp?.ingredient?.unit ?? null,
      component_stock: comp?.ingredient?.isStocked ?? null,
    }))

    res.json(rows)
  }, 'Failed to fetch hm ingredient components'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = requireString(req.body, 'name')
    const unit = requireString(req.body, 'unit')
    const { cost, notes, yieldAmount, image, isStocked } = req.body
    const created = await prisma.hmIngredient.create({
      data: {
        name,
        cost: Number(cost || 0),
        notes,
        unit,
        yieldAmount: Number(yieldAmount || 0),
        image: image || null,
        isStocked: Boolean(isStocked),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create hm ingredient'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const name = requireString(req.body, 'name')
    const unit = requireString(req.body, 'unit')
    const { cost, notes, yieldAmount, image, isStocked } = req.body
    const updated = await prisma.hmIngredient.update({
      where: { id },
      data: {
        name,
        cost: Number(cost || 0),
        notes,
        unit,
        yieldAmount: Number(yieldAmount || 0),
        image: image || null,
        isStocked: Boolean(isStocked),
      },
    })
    res.json(updated)
  }, 'Failed to update hm ingredient'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.hmIngredient.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  }, 'Failed to delete hm ingredient'),
)

export default router
