import { apiUrl, handleResponse } from './base'
import { mapRecipeIngredient } from './mappers'

export const getRecipeIngredients = async () => {
  const res = await fetch(apiUrl('/api/recipe-ingredients'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapRecipeIngredient) : data
}

export const getRecipeIngredientById = async (recipe_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/recipe-ingredients/${recipe_ingredient_id}`))
  const data = await handleResponse(res)
  return mapRecipeIngredient(data)
}

// Note: the by-recipe endpoint returns a flattened { ingredient_id, name, unit, quantity }
// shape (not the raw recipe_ingredient entity), so it's returned as-is, unmapped.
export const getRecipeIngredientByRecipeId = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipe-ingredients/by-recipe/${recipe_id}`))
  return handleResponse(res)
}

export const createRecipeIngredient = async (recipe_id, ingredient_id, quantity) => {
  const res = await fetch(apiUrl('/api/recipe-ingredients'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id, ingredient_id, quantity }),
  })
  const data = await handleResponse(res)
  return mapRecipeIngredient(data)
}

export const createMultipleRecipeIngredient = async (rows) => {
  const res = await fetch(apiUrl('/api/recipe-ingredients/bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  })
  const data = await handleResponse(res)
  return mapRecipeIngredient(data)
}

export const updateRecipeIngredient = async (
  recipe_id,
  ingredient_id,
  quantity,
  recipe_ingredient_id,
) => {
  const res = await fetch(apiUrl(`/api/recipe-ingredients/${recipe_ingredient_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id, ingredient_id, quantity }),
  })
  return handleResponse(res)
}

export const deleteRecipeIngredient = async (recipe_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/recipe-ingredients/${recipe_ingredient_id}`), {
    method: 'DELETE',
  })
  return handleResponse(res)
}

export const deleteRecipeIngredientByRecipeId = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipe-ingredients/by-recipe/${recipe_id}`), {
    method: 'DELETE',
  })
  return handleResponse(res)
}
