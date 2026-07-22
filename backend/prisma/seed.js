import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.ingredient.count()
  if (existing > 0) {
    console.log('Database already contains data; skipping seed.')
    return
  }

  // Ingredients
  const ingredients = [
    { name: 'London Dry Gin', cost: 0.05, unit: 'ml', isStocked: true },
    { name: 'Bourbon Whiskey', cost: 0.07, unit: 'ml', isStocked: true },
    { name: 'White Rum', cost: 0.04, unit: 'ml', isStocked: true },
    { name: 'Tequila Blanco', cost: 0.06, unit: 'ml', isStocked: true },
    { name: 'Campari', cost: 0.05, unit: 'ml', isStocked: true },
    { name: 'Sweet Vermouth', cost: 0.03, unit: 'ml', isStocked: true },
    { name: 'Green Chartreuse', cost: 0.12, unit: 'ml', isStocked: false },
    { name: 'Lemon Juice', cost: 0.01, unit: 'ml', isStocked: true },
    { name: 'Lime Juice', cost: 0.01, unit: 'ml', isStocked: true },
    { name: 'Orange Peel', cost: 0.1, unit: 'piece', isStocked: true },
    { name: 'Mint Leaves', cost: 0.05, unit: 'sprig', isStocked: true },
    { name: 'White Sugar', cost: 0.002, unit: 'g', isStocked: true },
    { name: 'Water', cost: 0.0, unit: 'ml', isStocked: true },
    { name: 'Honey', cost: 0.02, unit: 'g', isStocked: true },
    { name: 'Soda Water', cost: 0.01, unit: 'ml', isStocked: true },
    { name: 'Angostura Bitters', cost: 0.5, unit: 'dash', isStocked: true },
  ]

  const createdIngredients = []
  for (const item of ingredients) {
    const created = await prisma.ingredient.create({ data: item })
    createdIngredients.push(created)
  }

  // Glassware
  const glassData = [
    { name: 'Highball', brand: 'Generic', model: 'Highball', volume: 320, volumeWIce: 220 },
    { name: 'Rocks Glass', brand: 'Generic', model: 'Rocks Glass', volume: 300, volumeWIce: 200 },
    { name: 'Coupe', brand: 'Generic', model: 'Coupe', volume: 150, volumeWIce: 150 },
  ]
  const createdGlass = []
  for (const g of glassData) createdGlass.push(await prisma.glassware.create({ data: g }))

  // HM Ingredients
  const hmData = [
    {
      name: 'Simple Syrup',
      cost: 0.0,
      yieldAmount: 500,
      notes: 'Standard 1:1 sugar to water ratio.',
      unit: 'ml',
      image: null,
      isStocked: true,
    },
    {
      name: 'Honey Syrup',
      cost: 0.0,
      yieldAmount: 300,
      notes: 'Rich honey syrup for penicillin/bees knees.',
      unit: 'ml',
      image: null,
      isStocked: true,
    },
    {
      name: 'Lime Cordial',
      cost: 0.0,
      yieldAmount: 250,
      notes: 'Acid adjusted lime cordial.',
      unit: 'ml',
      image: null,
      isStocked: false,
    },
  ]
  const createdHm = []
  for (const h of hmData) createdHm.push(await prisma.hmIngredient.create({ data: h }))

  // HM Components (referencing created ingredients by name)
  const findIngredient = (name) => createdIngredients.find((i) => i.name === name)
  const findHm = (name) => createdHm.find((h) => h.name === name)

  const hmComponents = [
    { hm: 'Simple Syrup', ingredient: 'White Sugar', quantity: 250 },
    { hm: 'Simple Syrup', ingredient: 'Water', quantity: 250 },
    { hm: 'Honey Syrup', ingredient: 'Honey', quantity: 225 },
    { hm: 'Honey Syrup', ingredient: 'Water', quantity: 75 },
    { hm: 'Lime Cordial', ingredient: 'Lime Juice', quantity: 150 },
    { hm: 'Lime Cordial', ingredient: 'White Sugar', quantity: 100 },
  ]

  for (const comp of hmComponents) {
    await prisma.hmIngredientComponent.create({
      data: {
        hmIngredientId: findHm(comp.hm).id,
        ingredientId: findIngredient(comp.ingredient).id,
        quantity: comp.quantity,
      },
    })
  }

  // Recipes
  const recipes = [
    {
      name: 'Negroni',
      glassId: createdGlass[1].id,
      stepToMake:
        'Add all ingredients to mixing glass with ice. Stir until chilled. Strain over large rock.',
      garnish: 'Orange Peel',
      notes: 'The classic aperitivo.',
    },
    {
      name: 'Daiquiri',
      glassId: createdGlass[2].id,
      stepToMake: 'Add Rum, Lime, and Syrup to shaker. Shake hard with ice. Double strain.',
      garnish: 'Lime Wheel',
      notes: 'Adjust syrup based on lime acidity.',
    },
    {
      name: 'Old Fashioned',
      glassId: createdGlass[1].id,
      stepToMake: 'Add syrup and bitters. Add Whiskey. Stir with ice.',
      garnish: 'Orange Peel',
      notes: 'Use high proof bourbon.',
    },
    {
      name: "Bee's Knees",
      glassId: createdGlass[2].id,
      stepToMake: 'Shake all ingredients with ice. Fine strain.',
      garnish: 'Lemon Twist',
      notes: 'Gin sour variation.',
    },
    {
      name: 'The Last Word',
      glassId: createdGlass[2].id,
      stepToMake: 'Shake all ingredients with ice.',
      garnish: 'Luxardo Cherry',
      notes: 'Equal parts classic.',
    },
  ]
  const createdRecipes = []
  for (const r of recipes) createdRecipes.push(await prisma.recipe.create({ data: r }))

  // Recipe Ingredients (simple mapping)
  const addRI = async (recipeIndex, ingredientName, qty) => {
    const ing = findIngredient(ingredientName)
    if (!ing) return
    await prisma.recipeIngredient.create({
      data: { recipeId: createdRecipes[recipeIndex].id, ingredientId: ing.id, quantity: qty },
    })
  }

  await addRI(0, 'London Dry Gin', 30) // Negroni
  await addRI(0, 'Campari', 30)
  await addRI(0, 'Sweet Vermouth', 30)

  await addRI(1, 'White Rum', 60)
  await addRI(1, 'Lime Juice', 30)

  await addRI(2, 'Bourbon Whiskey', 60)
  await addRI(2, 'Angostura Bitters', 2)

  await addRI(3, 'London Dry Gin', 60)
  await addRI(3, 'Lemon Juice', 22.5)

  await addRI(4, 'London Dry Gin', 22.5)
  await addRI(4, 'Green Chartreuse', 22.5)
  await addRI(4, 'Lime Juice', 22.5)

  // Recipe HM Ingredients
  await prisma.recipeHmIngredient.create({
    data: {
      recipeId: createdRecipes[1].id,
      hmIngredientId: findHm('Simple Syrup').id,
      quantity: 22.5,
    },
  })
  await prisma.recipeHmIngredient.create({
    data: {
      recipeId: createdRecipes[2].id,
      hmIngredientId: findHm('Simple Syrup').id,
      quantity: 5,
    },
  })
  await prisma.recipeHmIngredient.create({
    data: {
      recipeId: createdRecipes[3].id,
      hmIngredientId: findHm('Honey Syrup').id,
      quantity: 22.5,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
