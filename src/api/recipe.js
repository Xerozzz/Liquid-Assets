import { apiUrl, handleResponse } from './base'
import { mapRecipe } from './mappers'

export const getRecipe = async () => {
  const res = await fetch(apiUrl('/api/recipes'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapRecipe) : data
}

export const getRecipeById = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipes/${recipe_id}`))
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const createRecipe = async (name, glass_id, step_to_make, image) => {
  const res = await fetch(apiUrl('/api/recipes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, glass_id, step_to_make, image }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const updateRecipe = async (name, glass_id, step_to_make, image, recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipes/${recipe_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, glass_id, step_to_make, image }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const deleteRecipe = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipes/${recipe_id}`), { method: 'DELETE' })
  return handleResponse(res)
}
