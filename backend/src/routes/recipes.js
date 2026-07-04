import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await prisma.recipe.findMany({ where: { isDeleted: false } })
    res.json(items)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch recipes' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const item = await prisma.recipe.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch recipe' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, glass_id, step_to_make, image, garnish, notes } = req.body
    const created = await prisma.recipe.create({
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        image: image || null,
        garnish: garnish || null,
        notes: notes || null,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create recipe' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, glass_id, step_to_make, image, garnish, notes } = req.body
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        image: image || null,
        garnish: garnish || null,
        notes: notes || null,
      },
    })
    res.json(updated)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update recipe' })
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
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

export default router
