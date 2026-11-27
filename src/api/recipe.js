import { apiUrl, handleResponse } from './base'
import { mapRecipe } from './mappers'

// Cocktails and mocktails share one backend resource (`recipe`, distinguished by
// `is_mocktail`) — see the "full section" note in AGENTS.md for why the API stays unified
// while the frontend gives them separate routes/pages.

export const getRecipe = async (type) => {
  const res = await fetch(apiUrl(type ? `/api/cocktails?type=${type}` : '/api/cocktails'))
  return handleResponse(res)
}

// Paginated + server-filtered/sorted list for the menu page. Returns { rows, total, page,
// page_size }. Pass `all: true` to get the whole filtered set (CSV export) or `random: true`
// to get a single random match (Surprise Me) — both still honor the active filters.
export const getRecipePage = async ({
  type,
  q,
  ingredient,
  stockOnly,
  sort,
  page,
  limit,
  all,
  random,
} = {}) => {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (q) params.set('q', q)
  if (ingredient) params.set('ingredient', ingredient)
  if (stockOnly) params.set('stock_only', '1')
  if (sort) params.set('sort', sort)
  if (random) params.set('random', '1')
  else if (all) params.set('all', '1')
  else {
    params.set('page', String(page || 1))
    params.set('limit', String(limit || 24))
  }
  const res = await fetch(apiUrl(`/api/cocktails?${params.toString()}`))
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
