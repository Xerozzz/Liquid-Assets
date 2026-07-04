import { apiUrl, handleResponse } from './base'
import { mapHmIngredientComponent } from './mappers'

export const getHmIngredientComponents = async () => {
  const res = await fetch(apiUrl('/api/hm-ingredient-components'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapHmIngredientComponent) : data
}

export const getHmIngredientComponentById = async (hm_ingredient_component_id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredient-components/${hm_ingredient_component_id}`))
  const data = await handleResponse(res)
  return mapHmIngredientComponent(data)
}

export const getHmIngredientComponentByHmIngredientId = async (hm_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredient-components/by-hm/${hm_ingredient_id}`))
  return handleResponse(res)
}

export const createHmIngredientComponent = async (hm_ingredient_id, ingredient_id, quantity) => {
  const res = await fetch(apiUrl('/api/hm-ingredient-components'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hm_ingredient_id, ingredient_id, quantity }),
  })
  const data = await handleResponse(res)
  return mapHmIngredientComponent(data)
}

export const createMultipleHmIngredientComponents = async (rows) => {
  const res = await fetch(apiUrl('/api/hm-ingredient-components/bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  })
  return handleResponse(res)
}

export const updateHmIngredientComponent = async (
  hm_ingredient_id,
  ingredient_id,
  quantity,
  hm_ingredient_component_id,
) => {
  const res = await fetch(apiUrl(`/api/hm-ingredient-components/${hm_ingredient_component_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hm_ingredient_id, ingredient_id, quantity }),
  })
  const data = await handleResponse(res)
  return mapHmIngredientComponent(data)
}

export const deleteHmIngredientComponent = async (hm_ingredient_component_id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredient-components/${hm_ingredient_component_id}`), {
    method: 'DELETE',
  })
  return handleResponse(res)
}
