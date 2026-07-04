import { apiUrl, handleResponse } from './base'
import { mapRecipe } from './mappers'

export const getCocktail = async () => {
  const res = await fetch(apiUrl('/api/cocktails'))
  return handleResponse(res)
}

export const getCocktailById = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`))
  return handleResponse(res)
}

export const createCocktail = async (name, glass_id, step_to_make, garnish, notes, image) => {
  const res = await fetch(apiUrl('/api/cocktails'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, glass_id, step_to_make, garnish, notes, image }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const updateCocktail = async (
  name,
  glass_id,
  step_to_make,
  garnish,
  notes,
  image,
  recipe_id,
) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, glass_id, step_to_make, garnish, notes, image }),
  })
  const data = await handleResponse(res)
  return mapRecipe(data)
}

export const deleteCocktail = async (recipe_id) => {
  const res = await fetch(apiUrl(`/api/cocktails/${recipe_id}`), { method: 'DELETE' })
  return handleResponse(res)
}

export const importCocktailFromCSV = async (cocktail, dbIngredients) => {
  const res = await fetch(apiUrl('/api/cocktails/import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cocktail, dbIngredients }),
  })
  return handleResponse(res)
}
