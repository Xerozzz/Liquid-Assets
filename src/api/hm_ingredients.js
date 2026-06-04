import { apiUrl, handleResponse } from './base'
import { mapHmIngredient } from './mappers'

export const getHmIngredient = async () => {
  const res = await fetch(apiUrl('/api/hm-ingredients'))
  const data = await handleResponse(res)
  return Array.isArray(data) ? data.map(mapHmIngredient) : data
}

export const getHmIngredientById = async (id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredients/${id}`))
  const data = await handleResponse(res)
  return mapHmIngredient(data)
}

export const createHmIngredient = async (
  name,
  cost,
  notes,
  unit,
  yield_amount,
  image,
  is_stocked,
) => {
  const res = await fetch(apiUrl('/api/hm-ingredients'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      cost,
      notes,
      unit,
      yieldAmount: yield_amount,
      image,
      isStocked: is_stocked,
    }),
  })
  const data = await handleResponse(res)
  return mapHmIngredient(data)
}

export const updateHmIngredient = async (
  name,
  cost,
  notes,
  image,
  unit,
  yield_amount,
  is_stocked,
  id,
) => {
  const res = await fetch(apiUrl(`/api/hm-ingredients/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      cost,
      notes,
      unit,
      yieldAmount: yield_amount,
      image,
      isStocked: is_stocked,
    }),
  })
  const data = await handleResponse(res)
  return mapHmIngredient(data)
}

export const deleteHmIngredient = async (id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredients/${id}`), { method: 'DELETE' })
  return handleResponse(res)
}

export const getHmIngredientWithComponents = async (hm_ingredient_id) => {
  const res = await fetch(apiUrl(`/api/hm-ingredients/${hm_ingredient_id}/components`))
  return handleResponse(res)
}

export const importHmIngredientFromCSV = async (item, dbIngredients) => {
  try {
    // Use client-side logic and backend endpoints for consistency
    const existing = await getHmIngredient()
    const duplicate = existing.find(
      (h) => h.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
    )
    if (duplicate) {
      return { success: false, name: item.name, error: 'Duplicate item already exists' }
    }

    let calculatedCost = 0
    const ingredientInserts = []
    const unknownIngredients = []

    for (const comp of item.ingredients) {
      const targetName = comp.name.trim().toLowerCase()
      const match = dbIngredients.find((dbIng) => dbIng.name.trim().toLowerCase() === targetName)

      if (match) {
        ingredientInserts.push({ id: match.id || match.ingredient_id, qty: comp.amount })
        calculatedCost += match.cost * comp.amount
      } else {
        unknownIngredients.push(comp.name)
      }
    }

    const finalYield = item.yield > 0 ? item.yield : 1
    const unitCost = calculatedCost / finalYield

    const created = await createHmIngredient(
      item.name,
      unitCost.toFixed(4),
      '',
      'ml',
      item.yield,
      null,
      1,
    )

    if (ingredientInserts.length > 0) {
      const rows = ingredientInserts.map((i) => ({
        hm_ingredient_id: created.id,
        ingredient_id: i.id,
        selected_quantity: i.qty,
      }))
      await fetch(apiUrl('/api/hm-ingredient-components/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      })
    }

    return { success: true, name: item.name, unknowns: unknownIngredients }
  } catch (error) {
    console.error('Import Error for ' + item.name, error)
    return { success: false, name: item.name, error: error.message }
  }
}
