import prisma from '../prisma.js'

/**
 * Recomputes and persists a homemade ingredient's cost from its current components.
 * Needed because hm_ingredients.cost is a snapshot taken when the item's components/yield
 * were last edited — it goes stale if a component's raw ingredient cost changes afterward.
 */
export async function recalculateHmIngredientCost(hmIngredientId) {
  const hm = await prisma.hmIngredient.findUnique({
    where: { id: hmIngredientId },
    include: { components: { include: { ingredient: true } } },
  })
  if (!hm) return null

  const totalCost = hm.components.reduce(
    (sum, c) => sum + Number(c.quantity || 0) * Number(c.ingredient?.cost || 0),
    0,
  )
  const cost = hm.yieldAmount > 0 ? totalCost / hm.yieldAmount : 0

  return prisma.hmIngredient.update({ where: { id: hmIngredientId }, data: { cost } })
}

/** Recomputes every homemade ingredient that uses the given raw ingredient as a component. */
export async function recalculateHmIngredientCostsForIngredient(ingredientId) {
  const links = await prisma.hmIngredientComponent.findMany({
    where: { ingredientId },
    select: { hmIngredientId: true },
    distinct: ['hmIngredientId'],
  })
  await Promise.all(links.map((l) => recalculateHmIngredientCost(l.hmIngredientId)))
}
