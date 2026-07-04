import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isDeleted: false },
      include: {
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })

    const rows = recipes.map((r) => {
      const rawItems = r.ingredients
      const hmItems = r.hmIngredients

      const missingCount =
        rawItems.filter((ri) => !ri.ingredient?.isStocked).length +
        hmItems.filter((hi) => !hi.hmIngredient?.isStocked).length

      return {
        recipe_id: r.id,
        name: r.name,
        glass_id: r.glassId,
        step_to_make: r.stepToMake,
        garnish: r.garnish,
        notes: r.notes,
        image: r.image,
        created_at: r.createdAt,
        missing_count: missingCount,
        raw_ingredients_str: rawItems.map((ri) => ri.ingredient?.name).filter(Boolean).join(', '),
        hm_ingredients_str: hmItems.map((hi) => hi.hmIngredient?.name).filter(Boolean).join(', '),
      }
    })

    res.json(rows)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch cocktails' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const recipeId = Number(req.params.id)
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, isDeleted: false },
      include: {
        glass: true,
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })

    if (!recipe) return res.json([])

    const base = {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      glass_id: recipe.glassId,
      glass_name: recipe.glass?.name || '',
      garnish: recipe.garnish,
      notes: recipe.notes,
      image: recipe.image,
      step_to_make: recipe.stepToMake,
    }

    const items = [
      ...recipe.ingredients.map((ri) => ({
        kind: 'ingredient',
        item_id: ri.ingredientId,
        item_name: ri.ingredient?.name,
        item_cost: ri.ingredient?.cost,
        item_unit: ri.ingredient?.unit,
        item_stock: ri.ingredient?.isStocked,
        item_quantity: ri.quantity,
      })),
      ...recipe.hmIngredients.map((rh) => ({
        kind: 'hm',
        item_id: rh.hmIngredientId,
        item_name: rh.hmIngredient?.name,
        item_cost: rh.hmIngredient?.cost,
        item_unit: rh.hmIngredient?.unit,
        item_stock: rh.hmIngredient?.isStocked,
        item_quantity: rh.quantity,
      })),
    ].sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''))

    if (items.length === 0) return res.json([{ ...base }])

    res.json(items.map((it) => ({ ...base, ...it })))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch cocktail details' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, glass_id, step_to_make, garnish, notes, image } = req.body
    const created = await prisma.recipe.create({
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to create cocktail' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, glass_id, step_to_make, garnish, notes, image } = req.body
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        glassId: Number(glass_id),
        stepToMake: step_to_make,
        garnish: garnish || null,
        notes: notes || null,
        image: image || null,
      },
    })
    res.json(updated)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to update cocktail' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.recipe.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    res.status(204).end()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to delete cocktail' })
  }
})

router.post('/import', async (req, res) => {
  try {
    const { cocktail } = req.body
    if (!cocktail?.name) return res.status(400).json({ error: 'Missing cocktail data' })

    const existing = await prisma.recipe.findFirst({
      where: { name: { equals: cocktail.name, mode: 'insensitive' }, isDeleted: false },
    })

    if (existing) {
      return res.json({
        success: false,
        name: cocktail.name,
        error: 'Duplicate cocktail already exists',
      })
    }

    let glass = null
    const unknowns = []

    if (cocktail.glassName) {
      glass = await prisma.glassware.findFirst({
        where: {
          name: { equals: cocktail.glassName, mode: 'insensitive' },
          isDeleted: false,
        },
      })
      if (!glass) unknowns.push(`glass:${cocktail.glassName}`)
    }

    if (!glass) {
      glass = await prisma.glassware.findFirst({ where: { isDeleted: false } })
    }

    if (!glass) {
      return res.json({
        success: false,
        name: cocktail.name,
        error: 'No glassware in database; add glassware before importing',
      })
    }

    const [dbIngredients, dbHm] = await Promise.all([
      prisma.ingredient.findMany({ where: { isDeleted: false } }),
      prisma.hmIngredient.findMany({ where: { isDeleted: false } }),
    ])

    const findRaw = (name) =>
      dbIngredients.find((d) => d.name.toLowerCase().trim() === name.toLowerCase().trim())
    const findHm = (name) =>
      dbHm.find((d) => d.name.toLowerCase().trim() === name.toLowerCase().trim())

    const rawInserts = []
    const hmInserts = []

    for (const item of cocktail.ingredients || []) {
      const raw = findRaw(item.name)
      if (raw) {
        rawInserts.push({ ingredientId: raw.id, quantity: Number(item.amount || 0) })
        continue
      }
      const hm = findHm(item.name)
      if (hm) {
        hmInserts.push({ hmIngredientId: hm.id, quantity: Number(item.amount || 0) })
        continue
      }
      unknowns.push(item.name)
    }

    const recipe = await prisma.$transaction(async (tx) => {
      const r = await tx.recipe.create({
        data: {
          name: cocktail.name,
          glassId: glass.id,
          stepToMake: cocktail.instructions || '',
          garnish: '',
          notes: '',
          image: null,
        },
      })
      for (const row of rawInserts) {
        await tx.recipeIngredient.create({ data: { recipeId: r.id, ...row } })
      }
      for (const row of hmInserts) {
        await tx.recipeHmIngredient.create({ data: { recipeId: r.id, ...row } })
      }
      return r
    })

    res.json({ success: true, name: cocktail.name, id: recipe.id, unknowns })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ error: 'Failed to import cocktail' })
  }
})

export default router
