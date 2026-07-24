import { describe, it, expect, afterAll } from 'vitest'
import { api } from './testApp.js'

describe('ingredients validation + CRUD', () => {
  const createdIds = []

  afterAll(async () => {
    await Promise.all(createdIds.map((id) => api.delete(`/api/ingredients/${id}`)))
  })

  it('rejects a missing name with 400', async () => {
    const res = await api.post('/api/ingredients').send({ unit: 'ml', cost: 1 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('rejects a missing unit with 400', async () => {
    const res = await api.post('/api/ingredients').send({ name: 'Test Ingredient', cost: 1 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/unit/i)
  })

  it('creates, updates, and soft-deletes an ingredient', async () => {
    const created = await api
      .post('/api/ingredients')
      .send({ name: `Vitest Ingredient ${Date.now()}`, unit: 'ml', cost: 1.5, isStocked: true })
    expect(created.status).toBe(201)
    expect(created.body.cost).toBe(1.5)
    createdIds.push(created.body.id)

    const updated = await api
      .put(`/api/ingredients/${created.body.id}`)
      .send({ name: created.body.name, unit: 'ml', cost: 2.25, isStocked: false })
    expect(updated.status).toBe(200)
    expect(updated.body.cost).toBe(2.25)
    expect(updated.body.isStocked).toBe(false)

    const deleted = await api.delete(`/api/ingredients/${created.body.id}`)
    expect(deleted.status).toBe(204)

    const list = await api.get('/api/ingredients')
    expect(list.body.find((i) => i.id === created.body.id)).toBeUndefined()
  })
})
