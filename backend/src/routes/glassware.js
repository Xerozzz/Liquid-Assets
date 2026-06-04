import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await prisma.glassware.findMany({ where: { isDeleted: false } })
    res.json(items)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch glassware' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const item = await prisma.glassware.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch glassware' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { brand, model, volume, volumeWIce } = req.body
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create glassware' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { brand, model, volume, volumeWIce } = req.body
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update glassware' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.glassware.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete glassware' })
  }
})

export default router
