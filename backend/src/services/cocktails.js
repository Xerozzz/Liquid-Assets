import prisma from '../prisma.js'

/**
 * Computes a recipe's total cost and out-of-stock count from its (already-included)
 * ingredients/hmIngredients. Shared by the cocktails list route and the chatbot tools so the
 * cost formula only lives in one place.
 */
export function computeRecipeCost(recipe) {
  const rawItems = recipe.ingredients || []
  const hmItems = recipe.hmIngredients || []

  const missingCount =
    rawItems.filter((ri) => !ri.ingredient?.isStocked).length +
    hmItems.filter((hi) => !hi.hmIngredient?.isStocked).length

  const totalCost =
    rawItems.reduce((sum, ri) => sum + Number(ri.quantity) * Number(ri.ingredient?.cost || 0), 0) +
    hmItems.reduce((sum, hi) => sum + Number(hi.quantity) * Number(hi.hmIngredient?.cost || 0), 0)

  return { totalCost, missingCount }
}

/** Total cost with the recipe's sale price factored in, or null margin fields if unpriced. */
export function computeMargin(totalCost, salePrice) {
  if (!(salePrice > 0)) return { margin: null, marginPercent: null }
  const margin = salePrice - totalCost
  return { margin, marginPercent: (margin / salePrice) * 100 }
}

/**
 * Creates a recipe by matching a glass and ingredients by name, used by both
 * the CSV import route and the chatbot's create_cocktail tool.
 */
export async function importCocktail(cocktail) {
  const existing = await prisma.recipe.findFirst({
    where: { name: { equals: cocktail.name, mode: 'insensitive' }, isDeleted: false },
  })

  if (existing) {
    return {
      success: false,
      name: cocktail.name,
      error: 'Duplicate cocktail already exists',
    }
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
    return {
      success: false,
      name: cocktail.name,
      error: 'No glassware in database; add glassware before importing',
    }
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
        salePrice: cocktail.salePrice != null ? Number(cocktail.salePrice) : null,
        isMocktail: Boolean(cocktail.isMocktail),
      },
    })
    await Promise.all([
      ...rawInserts.map((row) => tx.recipeIngredient.create({ data: { recipeId: r.id, ...row } })),
      ...hmInserts.map((row) => tx.recipeHmIngredient.create({ data: { recipeId: r.id, ...row } })),
    ])
    return r
  })

  return { success: true, name: cocktail.name, id: recipe.id, unknowns }
}
