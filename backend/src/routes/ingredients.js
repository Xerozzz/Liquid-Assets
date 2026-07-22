import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireString } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.ingredient.findMany({ where: { isDeleted: false } })
    res.json(items)
  }, 'Failed to fetch ingredients'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.ingredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch ingredient'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = requireString(req.body, 'name')
    const unit = requireString(req.body, 'unit')
    const { cost, isStocked } = req.body
    const created = await prisma.ingredient.create({
      data: { name, unit, cost: Number(cost || 0), isStocked: Boolean(isStocked) },
    })
    res.status(201).json(created)
  }, 'Failed to create ingredient'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const name = requireString(req.body, 'name')
    const unit = requireString(req.body, 'unit')
    const { cost, isStocked } = req.body
    const updated = await prisma.ingredient.update({
      where: { id },
      data: { name, unit, cost: Number(cost || 0), isStocked: Boolean(isStocked) },
    })
    res.json(updated)
  }, 'Failed to update ingredient'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.ingredient.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  }, 'Failed to delete ingredient'),
)

export default router
