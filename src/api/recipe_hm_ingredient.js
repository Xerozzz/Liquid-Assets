import { apiUrl, handleResponse } from './base'
import { mapRecipeHmIngredient } from './mappers'

export const getRecipeHmIngredient = async () => {
  const res = await fetch(apiUrl('/api/recipe-hm-ingredients'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapRecipeHmIngredient) : data
}

export const getRecipeHmIngredientById = async (recipe_hm_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/recipe-hm-ingredients/${recipe_hm_ingredient_id}`))
  const data = await handleResponse(res)
  return mapRecipeHmIngredient(data)
}

export const getRecipeHmIngredientByRecipeId = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipe-hm-ingredients/by-recipe/${recipe_id}`))
  const data = await handleResponse(res)
  return mapRecipeHmIngredient(data)
}

export const createRecipeHmIngredient = async (recipe_id, hm_ingredient_id, quantity) => {
  const res = await fetch(apiUrl('/api/recipe-hm-ingredients'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id, hm_ingredient_id, quantity }),
  })
  const data = await handleResponse(res)
  return mapRecipeHmIngredient(data)
}

export const createMultipleRecipeHmIngredient = async (rows) => {
  const res = await fetch(apiUrl('/api/recipe-hm-ingredients/bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  })
  const data = await handleResponse(res)
  return mapRecipeHmIngredient(data)
}

export const updateRecipeHmIngredient = async (
  recipe_id,
  hm_ingredient_id,
  quantity,
  recipe_hm_ingredient_id,
) => {
  const res = await fetch(apiUrl(`/api/recipe-hm-ingredients/${recipe_hm_ingredient_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id, hm_ingredient_id, quantity }),
  })
  return handleResponse(res)
}

export const deleteRecipeHmIngredient = async (recipe_hm_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/recipe-hm-ingredients/${recipe_hm_ingredient_id}`), {
    method: 'DELETE',
  })
  return handleResponse(res)
}

export const deleteRecipeHmIngredientByRecipeId = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/recipe-hm-ingredients/by-recipe/${recipe_id}`), {
    method: 'DELETE',
  })
  return handleResponse(res)
}
