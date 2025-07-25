import { useSQLite } from '@/composables/useSQLite'
const { executeQuery } = useSQLite()

export const getCocktail = async () => {
  try {
    let result = await executeQuery('SELECT * FROM recipe;')
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getCocktailById = async (recipe_id) => {
  try {
    let result = await executeQuery(
      `SELECT
        r.name AS recipe_name,
        g.name AS glass_name,
        i.name AS ingredient_name,
        ri.quantity
     FROM recipe r
     JOIN glassware g ON r.glass_id = g.glass_id
     JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id
     JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
     WHERE r.is_deleted = false
       AND ri.is_deleted = false
       AND r.recipe_id = ?
     ORDER BY i.name;`,
      [recipe_id],
    )

    return result?.result.resultRows
  } catch (error) {
    console.log(error)
  }
}

export const createCocktail = async (name, glass_id, step_to_make, image) => {
  try {
    let result = await executeQuery(
      'INSERT INTO recipe (name, glass_id, step_to_make, image) VALUES (?, ?, ?, ?);',
      [name, glass_id, step_to_make, image],
    )
    return Number(result?.result.lastInsertRowId)
  } catch (error) {
    console.log(error)
    return error
  }
}

export const updateCocktail = async (name, glass_id, step_to_make, image, recipe_id) => {
  try {
    let result = await executeQuery(
      'UPDATE recipe SET name = ?, glass_id = ?, step_to_make = ?, image = ? WHERE recipe_id = ?;',
      [name, glass_id, step_to_make, image, recipe_id],
    )
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

export const deleteCocktail = async (recipe_id) => {
  try {
    let result = await executeQuery('DELETE FROM recipe WHERE recipe_id = ?;', [recipe_id])
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}
