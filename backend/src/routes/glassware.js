import express from 'express'
import prisma from '../prisma.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireString } from '../validate.js'

const router = express.Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.glassware.findMany({ where: { isDeleted: false } })
    res.json(items)
  }, 'Failed to fetch glassware'),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const item = await prisma.glassware.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  }, 'Failed to fetch glassware'),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const brand = requireString(req.body, 'brand')
    const model = requireString(req.body, 'model')
    const { volume, volumeWIce } = req.body
    const name = `${brand} ${model}`.trim()
    const created = await prisma.glassware.create({
      data: {
        name,
        brand,
        model,
        volume: Number(volume || 0),
        volumeWIce: Number(volumeWIce || 0),
      },
    })
    res.status(201).json(created)
  }, 'Failed to create glassware'),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const brand = requireString(req.body, 'brand')
    const model = requireString(req.body, 'model')
    const { volume, volumeWIce } = req.body
    const name = `${brand} ${model}`.trim()
    const updated = await prisma.glassware.update({
      where: { id },
      data: {
        name,
        brand,
        model,
        volume: Number(volume || 0),
        volumeWIce: Number(volumeWIce || 0),
      },
    })
    res.json(updated)
  }, 'Failed to update glassware'),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await prisma.glassware.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  }, 'Failed to delete glassware'),
)

export default router
