import prisma from './prisma.js'
import { ValidationError } from './asyncHandler.js'
import { requireString } from './validate.js'
import { importCocktail } from './services/cocktails.js'

// No delete tools are exposed here on purpose — the chatbot can create and
// update records but destructive actions still have to go through the UI.

export const toolDeclarations = [
  {
    name: 'list_cocktails',
    description:
      'List all cocktails with their cost/stock status. Use this to answer questions about what cocktails exist or can be made.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_cocktail',
    description:
      'Get full recipe details (ingredients, steps, garnish) for a single cocktail by name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The cocktail name to look up.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_ingredients',
    description: 'List all raw ingredients with their unit cost and stock status.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_hm_ingredients',
    description: 'List all homemade ingredients with their unit cost and stock status.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_glassware',
    description: 'List all glassware with brand, model, and volume.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'create_ingredient',
    description: 'Create a new raw ingredient.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        unit: { type: 'STRING', description: 'e.g. ml, g, dash, piece' },
        cost: { type: 'NUMBER', description: 'Cost per unit.' },
        is_stocked: { type: 'BOOLEAN' },
      },
      required: ['name', 'unit'],
    },
  },
  {
    name: 'update_ingredient_stock',
    description: 'Mark an existing raw ingredient as in-stock or out-of-stock by name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        is_stocked: { type: 'BOOLEAN' },
      },
      required: ['name', 'is_stocked'],
    },
  },
  {
    name: 'create_glassware',
    description: 'Create a new glassware entry.',
    parameters: {
      type: 'OBJECT',
      properties: {
        brand: { type: 'STRING' },
        model: { type: 'STRING' },
        volume: { type: 'NUMBER', description: 'Volume in ml.' },
        volume_w_ice: { type: 'NUMBER', description: 'Volume with ice in ml.' },
      },
      required: ['brand', 'model'],
    },
  },
  {
    name: 'create_cocktail',
    description:
      'Create a new cocktail recipe. Ingredient names are matched (case-insensitive) against existing raw and homemade ingredients — unmatched names are reported back instead of failing the whole request.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        glass_name: {
          type: 'STRING',
          description:
            'Name of an existing glassware entry. Falls back to any glassware if omitted or not found.',
        },
        instructions: { type: 'STRING', description: 'Steps to make the cocktail.' },
        ingredients: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              amount: { type: 'NUMBER' },
            },
            required: ['name', 'amount'],
          },
        },
      },
      required: ['name'],
    },
  },
]

export const toolHandlers = {
  list_cocktails: async () => {
    const recipes = await prisma.recipe.findMany({
      where: { isDeleted: false },
      include: {
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })
    return recipes.map((r) => ({
      id: r.id,
      name: r.name,
      missing_count:
        r.ingredients.filter((ri) => !ri.ingredient?.isStocked).length +
        r.hmIngredients.filter((hi) => !hi.hmIngredient?.isStocked).length,
      ingredients: [
        ...r.ingredients.map((ri) => ri.ingredient?.name).filter(Boolean),
        ...r.hmIngredients.map((hi) => hi.hmIngredient?.name).filter(Boolean),
      ],
    }))
  },

  get_cocktail: async (args) => {
    const name = requireString(args, 'name')
    const recipe = await prisma.recipe.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false },
      include: {
        glass: true,
        ingredients: { include: { ingredient: true } },
        hmIngredients: { include: { hmIngredient: true } },
      },
    })
    if (!recipe) return { error: `No cocktail found named "${name}"` }

    return {
      id: recipe.id,
      name: recipe.name,
      glass: recipe.glass?.name || null,
      garnish: recipe.garnish,
      notes: recipe.notes,
      steps: recipe.stepToMake,
      ingredients: [
        ...recipe.ingredients.map((ri) => ({
          name: ri.ingredient?.name,
          quantity: ri.quantity,
          unit: ri.ingredient?.unit,
          in_stock: ri.ingredient?.isStocked,
        })),
        ...recipe.hmIngredients.map((rh) => ({
          name: rh.hmIngredient?.name,
          quantity: rh.quantity,
          unit: rh.hmIngredient?.unit,
          in_stock: rh.hmIngredient?.isStocked,
        })),
      ],
    }
  },

  list_ingredients: async () => {
    const items = await prisma.ingredient.findMany({
      where: { isDeleted: false },
      select: { name: true, unit: true, cost: true, isStocked: true },
    })
    return items.map((i) => ({ name: i.name, unit: i.unit, cost: i.cost, is_stocked: i.isStocked }))
  },

  list_hm_ingredients: async () => {
    const items = await prisma.hmIngredient.findMany({
      where: { isDeleted: false },
      select: { name: true, unit: true, cost: true, isStocked: true },
    })
    return items.map((i) => ({ name: i.name, unit: i.unit, cost: i.cost, is_stocked: i.isStocked }))
  },

  list_glassware: async () => {
    const items = await prisma.glassware.findMany({
      where: { isDeleted: false },
      select: { name: true, brand: true, model: true, volume: true, volumeWIce: true },
    })
    return items.map((i) => ({
      name: i.name,
      brand: i.brand,
      model: i.model,
      volume: i.volume,
      volume_w_ice: i.volumeWIce,
    }))
  },

  create_ingredient: async (args) => {
    const name = requireString(args, 'name')
    const unit = requireString(args, 'unit')
    const created = await prisma.ingredient.create({
      data: {
        name,
        unit,
        cost: Number(args.cost || 0),
        isStocked: args.is_stocked !== false,
      },
    })
    return { id: created.id, name: created.name }
  },

  update_ingredient_stock: async (args) => {
    const name = requireString(args, 'name')
    if (typeof args.is_stocked !== 'boolean') {
      throw new ValidationError('"is_stocked" must be true or false')
    }
    const item = await prisma.ingredient.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false },
    })
    if (!item) throw new ValidationError(`No ingredient found named "${name}"`)

    const updated = await prisma.ingredient.update({
      where: { id: item.id },
      data: { isStocked: args.is_stocked },
    })
    return { id: updated.id, name: updated.name, is_stocked: updated.isStocked }
  },

  create_glassware: async (args) => {
    const brand = requireString(args, 'brand')
    const model = requireString(args, 'model')
    const created = await prisma.glassware.create({
      data: {
        name: `${brand} ${model}`.trim(),
        brand,
        model,
        volume: Number(args.volume || 0),
        volumeWIce: Number(args.volume_w_ice || 0),
      },
    })
    return { id: created.id, name: created.name }
  },

  create_cocktail: async (args) => {
    const name = requireString(args, 'name')
    return importCocktail({
      name,
      glassName: args.glass_name,
      instructions: args.instructions,
      ingredients: Array.isArray(args.ingredients) ? args.ingredients : [],
    })
  },
}
