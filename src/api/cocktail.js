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
      WITH base AS (
  SELECT r.recipe_id,
         r.name  AS recipe_name,
         g.name  AS glass_name,
         r.garnish,
         r.notes,
         r.image,
         r.step_to_make
  FROM recipe r
  JOIN glassware g ON r.glass_id = g.glass_id
  WHERE r.is_deleted = false
    AND r.recipe_id = $1
),
items AS (
  SELECT 'ingredient' AS kind,
         i.ingredient_id AS item_id,
         i.name          AS item_name,
         i.cost          AS item_cost,
         i.is_stocked    AS item_stock,
         ri.quantity     AS item_quantity
  FROM recipe_ingredient ri
  JOIN ingredients i ON i.ingredient_id = ri.ingredient_id
  WHERE ri.is_deleted = false
    AND ri.recipe_id = $1

  UNION ALL

  SELECT 'hm'         AS kind,
         hmi.hm_ingredient_id AS item_id,
         hmi.name             AS item_name,
         hmi.cost             AS item_cost,
         hmi.is_stocked       AS item_stock,
         rhi.quantity         AS item_quantity
  FROM recipe_hm_ingredient rhi
  JOIN hm_ingredients hmi ON hmi.hm_ingredient_id = rhi.hm_ingredient_id
  WHERE rhi.recipe_id = $1
)
SELECT b.*, i.*
FROM base b
JOIN items i ON i.item_quantity IS NOT NULL   -- just to attach base data to each item
ORDER BY i.item_name;
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
export const createCocktail = async (
  name,
  glass_id,
  step_to_make,
  garnish = '',
  notes = '',
  image,
) => {
  try {
    let result = await executeQuery(
      'INSERT INTO recipe (name, glass_id, step_to_make, garnish, notes, image) VALUES (?, ?, ?, ?, ?, ?);',
      [name, glass_id, step_to_make, garnish, notes, image],
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
