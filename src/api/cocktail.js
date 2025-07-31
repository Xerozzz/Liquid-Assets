import { useSQLite } from '@/composables/useSQLite'
const { executeQuery } = useSQLite()

/**
 * Retrieves all cocktails from the `recipe` table.
 *
 * @async
 * @function getCocktail
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of recipe objects from the database.
 * @throws Will log and return an error object if the query fails.
 */
export const getCocktail = async () => {
  try {
    let result = await executeQuery('SELECT * FROM recipe;')
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

/**
 * Retrieves a cocktail and its related details (glassware, ingredients, etc.) by recipe ID.
 *
 * @async
 * @function getCocktailById
 * @param {number} recipe_id - The ID of the recipe to retrieve.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects containing:
 * - `recipe_name`: {string} The name of the recipe.
 * - `glass_name`: {string} The name of the glassware used.
 * - `garnish`: {string} The garnish for the cocktail.
 * - `notes`: {string} Any notes for the recipe.
 * - `ingredient_id`: {number} ID of the ingredient.
 * - `ingredient_name`: {string} Name of the ingredient.
 * - `ingredient_cost`: {number} Cost of the ingredient.
 * - `ingredient_stock`: {boolean} Whether the ingredient is in stock.
 * - `quantity`: {string|number} The quantity of the ingredient in the recipe.
 * @throws Will log the error if the query fails.
 */
export const getCocktailById = async (recipe_id) => {
  try {
    const query = `
      SELECT
          r.name AS recipe_name,
          g.name AS glass_name,
          r.garnish AS garnish,
          r.notes AS notes,
          i.ingredient_id AS ingredient_id,
          r.image AS image,
          r.step_to_make AS step_to_make,
          i.name AS ingredient_name,
          i.cost AS ingredient_cost,
          i.is_stocked AS ingredient_stock,
          ri.quantity
      FROM
          recipe r
          JOIN glassware g ON r.glass_id = g.glass_id
          JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id
          JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
      WHERE
          r.is_deleted = false
          AND ri.is_deleted = false
          AND r.recipe_id = ?
      ORDER BY
          i.name;
      `
    let result = await executeQuery(query, [recipe_id])

    return result?.result.resultRows
  } catch (error) {
    console.log(error)
  }
}

/**
 * Inserts a new cocktail recipe into the database.
 *
 * @async
 * @function createCocktail
 * @param {string} name - The name of the cocktail.
 * @param {number} glass_id - The ID of the glassware associated with the cocktail.
 * @param {string} step_to_make - Instructions on how to make the cocktail.
 * @param {string} image - A URL or base64-encoded image of the cocktail.
 * @returns {Promise<number|Error>} A promise that resolves to the `recipe_id` of the newly inserted cocktail or an error object.
 * @throws Will log and return an error object if the insert fails.
 */
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

/**
 * Updates an existing cocktail recipe in the database.
 *
 * @async
 * @function updateCocktail
 * @param {string} name - The updated name of the cocktail.
 * @param {number} glass_id - The updated glassware ID.
 * @param {string} step_to_make - The updated instructions for the cocktail.
 * @param {string} image - The updated image URL or base64 data.
 * @param {number} recipe_id - The ID of the recipe to update.
 * @returns {Promise<Object|Error>} A promise that resolves to the update result or an error object.
 * @throws Will log and return an error object if the update fails.
 */
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

/**
 * Deletes a cocktail recipe from the database by ID.
 *
 * @async
 * @function deleteCocktail
 * @param {number} recipe_id - The ID of the recipe to delete.
 * @returns {Promise<Object|Error>} A promise that resolves to the deletion result or an error object.
 * @throws Will log and return an error object if the delete fails.
 */
export const deleteCocktail = async (recipe_id) => {
  try {
    let result = await executeQuery('DELETE FROM recipe WHERE recipe_id = ?;', [recipe_id])
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}
