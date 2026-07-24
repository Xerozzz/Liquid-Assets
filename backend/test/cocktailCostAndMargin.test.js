import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from './testApp.js'

describe('cocktail cost + sale price', () => {
  let glassId
  let ingredientId
  let recipeId
  let recipeIngredientId

  beforeAll(async () => {
    const glassware = await api.get('/api/glassware')
    expect(glassware.body.length).toBeGreaterThan(0)
    glassId = glassware.body[0].id
  })

  afterAll(async () => {
    if (recipeIngredientId) await api.delete(`/api/recipe-ingredients/${recipeIngredientId}`)
    if (recipeId) await api.delete(`/api/cocktails/${recipeId}`)
    if (ingredientId) await api.delete(`/api/ingredients/${ingredientId}`)
  })

  it('computes total_cost live and passes sale_price through', async () => {
    const ingredient = await api
      .post('/api/ingredients')
      .send({
        name: `Vitest Cocktail Ingredient ${Date.now()}`,
        unit: 'ml',
        cost: 2,
        isStocked: true,
      })
    expect(ingredient.status).toBe(201)
    ingredientId = ingredient.body.id

    const cocktail = await api.post('/api/cocktails').send({
      name: `Vitest Margin Cocktail ${Date.now()}`,
      glass_id: glassId,
      step_to_make: 'Stir and strain.',
      garnish: '',
      notes: '',
      image: null,
      sale_price: 10,
    })
    expect(cocktail.status).toBe(201)
    recipeId = cocktail.body.id

    const link = await api
      .post('/api/recipe-ingredients')
      .send({ recipe_id: recipeId, ingredient_id: ingredientId, quantity: 1 })
    expect(link.status).toBe(201)
    recipeIngredientId = link.body.id

    const list = await api.get('/api/cocktails')
    const row = list.body.find((c) => c.recipe_id === recipeId)
    expect(row).toBeDefined()
    expect(row.total_cost).toBe(2) // 1 * $2/ml
    expect(row.sale_price).toBe(10)
    expect(row.missing_count).toBe(0)

    const detail = await api.get(`/api/cocktails/${recipeId}`)
    expect(detail.status).toBe(200)
    expect(detail.body[0].sale_price).toBe(10)
    expect(detail.body[0].item_cost).toBe(2)
    expect(detail.body[0].item_quantity).toBe(1)
  })
})
