import { useSQLite } from '@/composables/useSQLite'
const { executeQuery, destroy } = useSQLite()

// --- Helper to fix Foreign Key Error ---
const ensureDefaultGlassware = async () => {
  try {
    let check = await executeQuery('SELECT glass_id FROM glassware WHERE glass_id = 1;')
    if (check?.result?.resultRows?.length > 0) return 1

    let anyGlass = await executeQuery('SELECT glass_id FROM glassware LIMIT 1;')
    if (anyGlass?.result?.resultRows?.length > 0) return anyGlass.result.resultRows[0].glass_id

    let create = await executeQuery(
      "INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES ('Standard Glass', 'Generic', 'Standard', 300, 200);",
    )
    return Number(create?.result?.lastInsertRowId)
  } catch (e) {
    console.error('Failed to ensure glassware', e)
    return 1
  }
}

export const getCocktail = async () => {
  try {
    let result = await executeQuery('SELECT * FROM recipe WHERE is_deleted = 0;')
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
 * PROTECTS AGAINST DUPLICATES by checking name first.
 */
export const importCocktailFromCSV = async (cocktail, dbIngredients) => {
  try {
    const existing = await executeQuery(
      'SELECT recipe_id FROM recipe WHERE LOWER(name) = LOWER(?) AND is_deleted = 0;',
      [cocktail.name],
    )

    if (existing?.result?.resultRows?.length > 0) {
      console.log(`Skipping duplicate: ${cocktail.name}`)
      return { success: false, name: cocktail.name, error: 'Duplicate cocktail already exists' }
    }

    // Get Valid Glass ID
    const validGlassId = await ensureDefaultGlassware()

    let result = await executeQuery(
      'INSERT INTO recipe (name, glass_id, step_to_make, garnish, notes, image) VALUES (?, ?, ?, ?, ?, ?);',
      [cocktail.name, validGlassId, cocktail.instructions, '', '', null],
    )
    const recipeId = Number(result?.result.lastInsertRowId)

    if (!recipeId) throw new Error('Failed to create recipe record')

    const ingredientInserts = []
    const unknownIngredients = []

    for (const item of cocktail.ingredients) {
      const match = dbIngredients.find(
        (dbIng) => dbIng.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
      )

      if (match) {
        ingredientInserts.push({
          recipeId,
          ingredientId: match.ingredient_id,
          quantity: item.amount,
        })
      } else {
        unknownIngredients.push(item.name)
      }
    }

    for (const ing of ingredientInserts) {
      await executeQuery(
        'INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?);',
        [ing.recipeId, ing.ingredientId, ing.quantity],
      )
    }

    return { success: true, name: cocktail.name, unknowns: unknownIngredients }
  } catch (error) {
    console.error('Import Error for ' + cocktail.name, error)
    return { success: false, name: cocktail.name, error: error.message }
  }
}
