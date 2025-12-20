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

export const createMultipleIngredients = async (rows) => {
  try {
    if (!Array.isArray(rows)) {
      throw new TypeError('createMultipleIngredients: "rows" must be a non-empty array.')
    }

    if (rows.length === 0) {
      // Explicitly indicate a successful no-op when there are no rows to insert
      return { rowsInserted: 0 }
    }
    // Create placeholders: (?,?,?,?), (?,?,?,?)...
    const placeholders = rows.map(() => '(?, ?, ?, ?)').join(',')

    // Flatten data: name, unit, cost, is_stocked
    // IMPORTANT: Ensure the order matches the INSERT statement below
    const flatValues = rows.flatMap((r) => [r.name, r.unit, r.cost, r.is_stocked ? 1 : 0])

    const query = `INSERT INTO ingredients (name, unit, cost, is_stocked) VALUES ${placeholders};`

    let result = await executeQuery(query, flatValues)
    destroy()
    return result
  } catch (error) {
    console.log(error)
    throw error
  }
}
