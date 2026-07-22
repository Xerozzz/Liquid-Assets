import { apiUrl, handleResponse } from './base'
import { mapIngredient } from './mappers'

export const getIngredients = async () => {
  const res = await fetch(apiUrl('/api/ingredients'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapIngredient) : data
}

export const getIngredientById = async (ingredient_id) => {
  const res = await fetch(apiUrl(`/api/ingredients/${ingredient_id}`))
  const data = await handleResponse(res)
  return mapIngredient(data)
}

export const createIngredient = async (name, unit, cost, is_stocked) => {
  const res = await fetch(apiUrl('/api/ingredients'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, unit, cost, isStocked: is_stocked }),
  })
  const data = await handleResponse(res)
  return mapIngredient(data)
}

export const updateIngredient = async (name, unit, cost, is_stocked, ingredient_id) => {
  const res = await fetch(apiUrl(`/api/ingredients/${ingredient_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, unit, cost, isStocked: is_stocked }),
  })
  const data = await handleResponse(res)
  return mapIngredient(data)
}

export const deleteIngredient = async (ingredient_id) => {
  const res = await fetch(apiUrl(`/api/ingredients/${ingredient_id}`), { method: 'DELETE' })
  return handleResponse(res)
}

export const createMultipleIngredients = async (rows) => {
  if (!Array.isArray(rows))
    throw new TypeError('createMultipleIngredients: "rows" must be an array')
  return Promise.all(rows.map((r) => createIngredient(r.name, r.unit, r.cost, r.is_stocked)))
}
