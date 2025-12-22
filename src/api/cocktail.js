import { useSQLite } from '@/composables/useSQLite'
const { executeQuery, destroy } = useSQLite()

// --- Helper to fix Foreign Key Error ---
const ensureDefaultGlassware = async () => {
  try {
    // Check if glass_id 1 specifically exists (for cleaner data)
    let check = await executeQuery('SELECT glass_id FROM glassware WHERE glass_id = 1;')
    if (check?.result?.resultRows?.length > 0) return 1

    // If not, check if ANY glass exists and return the first one
    let anyGlass = await executeQuery('SELECT glass_id FROM glassware LIMIT 1;')
    if (anyGlass?.result?.resultRows?.length > 0) return anyGlass.result.resultRows[0].glass_id

    // If table is empty, insert a default glass
    let create = await executeQuery(
      "INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES ('Standard Glass', 'Generic', 'Standard', 300, 200);",
    )
    return Number(create?.result?.lastInsertRowId)
  } catch (e) {
    console.error('Failed to ensure glassware', e)
    return 1 // Fallback
  }
}

// --- Helper to Find Glass by Name ---
const findGlassByName = async (name) => {
  if (!name) return null
  try {
    const res = await executeQuery('SELECT glass_id FROM glassware WHERE LOWER(name) = LOWER(?)', [
      name.trim(),
    ])
    if (res?.result?.resultRows?.length > 0) {
      return res.result.resultRows[0].glass_id
    }
    return null
  } catch (e) {
    return null
  }
}

export const getCocktail = async () => {
  try {
    const query = `
      SELECT
        r.*,
        -- Count missing raw ingredients
        (
          SELECT COUNT(*)
          FROM recipe_ingredient ri
          JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
          WHERE ri.recipe_id = r.recipe_id AND (i.is_stocked = 0 OR i.is_stocked IS NULL) AND ri.is_deleted = 0
        ) +
        -- Count missing homemade ingredients
        (
          SELECT COUNT(*)
          FROM recipe_hm_ingredient rhi
          JOIN hm_ingredients hmi ON rhi.hm_ingredient_id = hmi.hm_ingredient_id
          WHERE rhi.recipe_id = r.recipe_id AND (hmi.is_stocked = 0 OR hmi.is_stocked IS NULL) AND rhi.is_deleted = 0
        ) as missing_count,
        -- Get raw ingredient names for search
        (
            SELECT GROUP_CONCAT(i.name, ', ')
            FROM recipe_ingredient ri
            JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
            WHERE ri.recipe_id = r.recipe_id AND ri.is_deleted = 0
        ) as raw_ingredients_str,
        -- Get homemade ingredient names for search
        (
            SELECT GROUP_CONCAT(hmi.name, ', ')
            FROM recipe_hm_ingredient rhi
            JOIN hm_ingredients hmi ON rhi.hm_ingredient_id = hmi.hm_ingredient_id
            WHERE rhi.recipe_id = r.recipe_id AND rhi.is_deleted = 0
        ) as hm_ingredients_str
      FROM recipe r
      WHERE r.is_deleted = 0;
    `
    let result = await executeQuery(query)
    destroy()
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getCocktailById = async (recipe_id) => {
  try {
    const query = `
      WITH base AS (
        SELECT r.recipe_id,
               r.name  AS recipe_name,
               g.name  AS glass_name,
               g.glass_id AS glass_id,
               r.garnish,
               r.notes,
               r.image,
               r.step_to_make
        FROM recipe r
        JOIN glassware g ON r.glass_id = g.glass_id
        WHERE r.is_deleted = 0
          AND r.recipe_id = ?
      ),
      items AS (
        SELECT 'ingredient' AS kind,
               i.ingredient_id AS item_id,
               i.name          AS item_name,
               i.cost          AS item_cost,
               i.unit          AS item_unit,
               i.is_stocked    AS item_stock,
               ri.quantity     AS item_quantity
        FROM recipe_ingredient ri
        JOIN ingredients i ON i.ingredient_id = ri.ingredient_id
        WHERE ri.is_deleted = 0
          AND ri.recipe_id = ?

        UNION ALL

        SELECT 'hm' AS kind,
               hmi.hm_ingredient_id AS item_id,
               hmi.name             AS item_name,
               hmi.cost             AS item_cost,
               hmi.unit             AS item_unit,
               hmi.is_stocked       AS item_stock,
               rhi.quantity         AS item_quantity
        FROM recipe_hm_ingredient rhi
        JOIN hm_ingredients hmi ON hmi.hm_ingredient_id = rhi.hm_ingredient_id
        WHERE rhi.is_deleted = 0
          AND rhi.recipe_id = ?
      )
      SELECT b.*, i.*
      FROM base b
      CROSS JOIN items i
      ORDER BY i.item_name;
    `
    const result = await executeQuery(query, [recipe_id, recipe_id, recipe_id])
    destroy()
    return result?.result?.resultRows
  } catch (error) {
    console.log(error)
  }
}

export const createCocktail = async (name, glass_id, step_to_make, garnish, notes, image) => {
  try {
    let result = await executeQuery(
      'INSERT INTO recipe (name, glass_id, step_to_make, garnish, notes, image) VALUES (?, ?, ?, ?, ?, ?);',
      [name, glass_id, step_to_make, garnish, notes, image],
    )
    destroy()
    return Number(result?.result.lastInsertRowId)
  } catch (error) {
    console.log(error)
    return error
  }
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
  try {
    let result = await executeQuery(
      'UPDATE recipe SET name = ?, glass_id = ?, step_to_make = ?, garnish = ?, notes = ?, image = ? WHERE recipe_id = ?;',
      [name, glass_id, step_to_make, garnish, notes, image, recipe_id],
    )
    destroy()
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

export const deleteCocktail = async (recipe_id) => {
  try {
    let result = await executeQuery('UPDATE recipe SET is_deleted = 1 WHERE recipe_id = ?;', [
      recipe_id,
    ])
    destroy()
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

/**
 * Imports a single cocktail and its ingredients.
 * @param {Object} cocktail - { name, instructions, ingredients, glassName (optional) }
 * @param {Array} dbIngredients - List of existing DB ingredients for matching
 */
export const importCocktailFromCSV = async (cocktail, dbIngredients) => {
  try {
    // Check for Duplicate (Case-Insensitive)
    const existing = await executeQuery(
      'SELECT recipe_id FROM recipe WHERE LOWER(name) = LOWER(?) AND is_deleted = 0;',
      [cocktail.name],
    )

    if (existing?.result?.resultRows?.length > 0) {
      console.log(`Skipping duplicate: ${cocktail.name}`)
      return { success: false, name: cocktail.name, error: 'Duplicate cocktail already exists' }
    }

    // Resolve Glass ID
    let validGlassId
    if (cocktail.glassName) {
      validGlassId = await findGlassByName(cocktail.glassName)
    }

    // Fallback if glass name not found or not provided
    if (!validGlassId) {
      validGlassId = await ensureDefaultGlassware()
    }

    // Create Recipe
    let result = await executeQuery(
      'INSERT INTO recipe (name, glass_id, step_to_make, garnish, notes, image) VALUES (?, ?, ?, ?, ?, ?);',
      [cocktail.name, validGlassId, cocktail.instructions, '', '', null],
    )
    const recipeId = Number(result?.result.lastInsertRowId)

    if (!recipeId) throw new Error('Failed to create recipe record')

    // Map and Insert Ingredients
    const ingredientInserts = []
    const unknownIngredients = []

    for (const item of cocktail.ingredients) {
      // Find matching ingredient in DB (Case-insensitive + Trim)
      const match = dbIngredients.find(
        (dbIng) => dbIng.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
      )

      if (match) {
        ingredientInserts.push(`(${recipeId}, ${match.ingredient_id}, ${item.amount})`)
      } else {
        unknownIngredients.push(item.name)
      }
    }

    if (ingredientInserts.length > 0) {
      const query = `
        INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity)
        VALUES ${ingredientInserts.join(',')};
      `
      await executeQuery(query)
    }

    return { success: true, name: cocktail.name, unknowns: unknownIngredients }
  } catch (error) {
    console.error('Import Error for ' + cocktail.name, error)
    return { success: false, name: cocktail.name, error: error.message }
  }
}
