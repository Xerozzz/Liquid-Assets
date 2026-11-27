import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from './testApp.js'

// Exercises the opt-in paginated/filtered/sorted mode of GET /api/cocktails without
// depending on the exact contents of the seeded data: it creates two throwaway cocktails
// sharing a unique search token, then filters down to just those two.
describe('cocktail list pagination + filtering', () => {
  const token = `ZZPGN${Date.now()}` // unique marker so our search matches only these rows
  let glassId
  const recipeIds = []

  beforeAll(async () => {
    const glassware = await api.get('/api/glassware')
    expect(glassware.body.length).toBeGreaterThan(0)
    glassId = glassware.body[0].id

    for (const suffix of ['Alpha', 'Bravo']) {
      const res = await api.post('/api/cocktails').send({
        name: `${token} ${suffix}`,
        glass_id: glassId,
        step_to_make: 'Stir.',
        garnish: '',
        notes: '',
        image: null,
        sale_price: 10,
      })
      expect(res.status).toBe(201)
      recipeIds.push(res.body.id)
    }
  })

  afterAll(async () => {
    for (const id of recipeIds) await api.delete(`/api/cocktails/${id}`)
  })

  it('returns a plain array in legacy (unpaginated) mode', async () => {
    const res = await api.get('/api/cocktails')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('returns an { rows, total, page, page_size } envelope in paginated mode', async () => {
    const res = await api.get(`/api/cocktails?q=${token}&page=1&limit=1&sort=name_asc`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.rows)).toBe(true)
    expect(res.body.total).toBe(2) // both our cocktails match the token
    expect(res.body.page_size).toBe(1)
    expect(res.body.rows.length).toBe(1) // but only one fits on this page
    expect(res.body.rows[0].name).toContain('Alpha') // name_asc -> Alpha before Bravo
  })

  it('paginates: page 2 returns the second match', async () => {
    const res = await api.get(`/api/cocktails?q=${token}&page=2&limit=1&sort=name_asc`)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(2)
    expect(res.body.rows.length).toBe(1)
    expect(res.body.rows[0].name).toContain('Bravo')
  })

  it('respects sort direction (name_desc)', async () => {
    const res = await api.get(`/api/cocktails?q=${token}&page=1&limit=1&sort=name_desc`)
    expect(res.body.rows[0].name).toContain('Bravo')
  })

  it('all=1 returns every match, unpaged', async () => {
    const res = await api.get(`/api/cocktails?q=${token}&all=1`)
    expect(res.body.total).toBe(2)
    expect(res.body.rows.length).toBe(2)
  })

  it('random=1 returns a single match from the filtered set', async () => {
    const res = await api.get(`/api/cocktails?q=${token}&random=1`)
    expect(res.body.total).toBe(2)
    expect(res.body.rows.length).toBe(1)
    expect(res.body.rows[0].name).toContain(token)
  })
})
