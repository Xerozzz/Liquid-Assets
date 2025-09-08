import { useSQLite } from '@/composables/useSQLite'
const { executeQuery, destroy } = useSQLite()

export const getIngredients = async () => {
  try {
    let result = await executeQuery('SELECT * FROM ingredients;')
    destroy()
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getIngredientById = async (ingredient_id) => {
  try {
    let result = await executeQuery('SELECT * FROM ingredients WHERE ingredient_id = ?;', [
      ingredient_id,
    ])
    destroy()
    return result?.result.resultRows[0]
  } catch (error) {
    console.log(error)
    return error
  }
}

export const createIngredient = async (name, unit, cost, is_stocked) => {
  try {
    let result = await executeQuery(
      'INSERT INTO ingredients (name, unit, cost, is_stocked) VALUES (?, ?, ?, ?);',
      [name, unit, cost, is_stocked],
    )
    destroy()
    return Number(result?.result.lastInsertRowId)
  } catch (error) {
    console.log(error)
    return error
  }
}

export const updateIngredient = async (name, unit, cost, is_stocked, ingredient_id) => {
  try {
    let result = await executeQuery(
      'UPDATE ingredients SET name = ?, unit = ?, cost = ?, is_stocked = ? WHERE ingredient_id = ?;',
      [name, unit, cost, is_stocked, ingredient_id],
    )
    destroy()
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

export const deleteIngredient = async (ingredient_id) => {
  let res
  try {
    res = await executeQuery('DELETE FROM ingredients WHERE ingredient_id = ?;', [ingredient_id])
  } catch (rawErr) {
    throw rawErr
  }
}
