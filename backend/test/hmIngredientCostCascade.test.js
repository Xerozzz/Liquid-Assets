import { describe, it, expect, afterAll } from 'vitest'
import { api } from './testApp.js'

// Regression test for the bug fixed 2026-07-24: hm_ingredients.cost is a stored snapshot that
// must be recomputed whenever a component's raw ingredient cost changes — see the "stale
// homemade-ingredient costs" note in AGENTS.md and backend/src/services/hmIngredients.js.
describe('homemade ingredient cost cascade', () => {
  let ingredientId
  let hmIngredientId
  let componentId

  afterAll(async () => {
    if (componentId) await api.delete(`/api/hm-ingredient-components/${componentId}`)
    if (hmIngredientId) await api.delete(`/api/hm-ingredients/${hmIngredientId}`)
    if (ingredientId) await api.delete(`/api/ingredients/${ingredientId}`)
  })

  it('recomputes hm_ingredient.cost after its component ingredient is repriced', async () => {
    const ingredient = await api
      .post('/api/ingredients')
      .send({
        name: `Vitest Cascade Ingredient ${Date.now()}`,
        unit: 'ml',
        cost: 1,
        isStocked: true,
      })
    expect(ingredient.status).toBe(201)
    ingredientId = ingredient.body.id

    const hmIngredient = await api.post('/api/hm-ingredients').send({
      name: `Vitest Cascade Syrup ${Date.now()}`,
      cost: 0, // intentionally wrong — nothing should trust this until a component links in
      unit: 'ml',
      yieldAmount: 100,
      isStocked: true,
    })
    expect(hmIngredient.status).toBe(201)
    hmIngredientId = hmIngredient.body.id

    const component = await api.post('/api/hm-ingredient-components').send({
      hm_ingredient_id: hmIngredientId,
      ingredient_id: ingredientId,
      quantity: 50,
    })
    expect(component.status).toBe(201)
    componentId = component.body.id

    // Reprice the raw ingredient: 1 -> 4. Expected hm_ingredient cost: (50 * 4) / 100 = 2.
    const repriced = await api
      .put(`/api/ingredients/${ingredientId}`)
      .send({ name: ingredient.body.name, unit: 'ml', cost: 4, isStocked: true })
    expect(repriced.status).toBe(200)

    const updatedHm = await api.get(`/api/hm-ingredients/${hmIngredientId}`)
    expect(updatedHm.status).toBe(200)
    expect(updatedHm.body.cost).toBe(2)
  })
})
