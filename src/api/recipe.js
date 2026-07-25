import { apiUrl, handleResponse } from './base'
import { mapRecipe } from './mappers'

// Cocktails and mocktails share one backend resource (`recipe`, distinguished by
// `is_mocktail`) — see the "full section" note in AGENTS.md for why the API stays unified
// while the frontend gives them separate routes/pages.

export const getRecipe = async (type) => {
  const res = await fetch(apiUrl(type ? `/api/cocktails?type=${type}` : '/api/cocktails'))
  return handleResponse(res)
}

export const getRecipeById = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`))
  return handleResponse(res)
}

export const createRecipe = async (
  name,
  glass_id,
  step_to_make,
  garnish,
  notes,
  image,
  sale_price,
  is_mocktail,
) => {
  const res = await fetch(apiUrl('/api/cocktails'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      glass_id,
      step_to_make,
      garnish,
      notes,
      image,
      sale_price,
      is_mocktail,
    }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const updateRecipe = async (
  name,
  glass_id,
  step_to_make,
  garnish,
  notes,
  image,
  recipe_id,
  sale_price,
  is_mocktail,
) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      glass_id,
      step_to_make,
      garnish,
      notes,
      image,
      sale_price,
      is_mocktail,
    }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const deleteRecipe = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`), { method: 'DELETE' })
  return handleResponse(res)
}

export const importRecipeFromCSV = async (recipe, dbIngredients) => {
  const res = await fetch(apiUrl('/api/cocktails/import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cocktail: recipe, dbIngredients }),
  })
  return handleResponse(res)
}
