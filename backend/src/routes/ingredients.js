import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await prisma.ingredient.findMany({ where: { isDeleted: false } })
    res.json(items)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch ingredients' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const item = await prisma.ingredient.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch ingredient' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, unit, cost, isStocked } = req.body
    const created = await prisma.ingredient.create({
      data: { name, unit, cost: Number(cost || 0), isStocked: Boolean(isStocked) },
    })
    res.status(201).json(created)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create ingredient' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, unit, cost, isStocked } = req.body
    const updated = await prisma.ingredient.update({
      where: { id },
      data: { name, unit, cost: Number(cost || 0), isStocked: Boolean(isStocked) },
    })
    res.json(updated)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update ingredient' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.ingredient.update({ where: { id }, data: { isDeleted: true } })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete ingredient' })
  }
})

export default router
