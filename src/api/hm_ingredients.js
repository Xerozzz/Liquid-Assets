import { useSQLite } from '@/composables/useSQLite'
const { executeQuery, destroy } = useSQLite()

export const getHmIngredient = async () => {
  try {
    let result = await executeQuery('SELECT * FROM hm_ingredients WHERE is_deleted = 0;')
    destroy()
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getHmIngredientById = async (id) => {
  try {
    let result = await executeQuery('SELECT * FROM hm_ingredients WHERE hm_ingredient_id = ?;', [
      id,
    ])
    destroy()
    return result?.result.resultRows[0]
  } catch (error) {
    console.log(error)
    return error
  }
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
  try {
    let result = await executeQuery(
      'INSERT INTO hm_ingredients (name, cost, notes, unit, yield, image, is_stocked) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [name, cost, notes, unit, yield_amount, image, is_stocked],
    )
    destroy()
    return Number(result?.result.lastInsertRowId)
  } catch (error) {
    console.log(error)
    return error
  }
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
  try {
    let result = await executeQuery(
      'UPDATE hm_ingredients SET name = ?, cost = ?, notes = ?, image = ?, unit = ?, yield = ?, is_stocked = ? WHERE hm_ingredient_id = ?;',
      [name, cost, notes, image, unit, yield_amount, is_stocked, id],
    )
    destroy()
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

export const deleteHmIngredient = async (id) => {
  try {
    let result = await executeQuery(
      'UPDATE hm_ingredients SET is_deleted = 1 WHERE hm_ingredient_id = ?;',
      [id],
    )
    destroy()
    return result
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getHmIngredientWithComponents = async (hm_ingredient_id) => {
  try {
    const query = `
      SELECT
        hmi.hm_ingredient_id,
        hmi.name AS hm_ingredient_name,
        hmi.cost AS hm_ingredient_cost,
        hmi.image AS hm_ingredient_image,
        hmi.unit AS hm_ingredient_unit,
        hmi.yield AS hm_ingredient_yield,
        hmi.notes AS hm_ingredient_notes,
        hmi.is_stocked,
        hmic.quantity AS component_quantity,
        i.ingredient_id AS component_id,
        i.name AS component_name,
        i.cost AS component_cost,
        i.unit AS component_unit,
        i.is_stocked AS component_stock
      FROM hm_ingredients hmi
      LEFT JOIN hm_ingredient_components hmic ON hmi.hm_ingredient_id = hmic.hm_ingredient_id
      LEFT JOIN ingredients i ON hmic.ingredient_id = i.ingredient_id
      WHERE hmi.hm_ingredient_id = ? AND hmi.is_deleted = 0 AND (hmic.is_deleted = 0 OR hmic.is_deleted IS NULL);
    `
    const result = await executeQuery(query, [hm_ingredient_id])
    destroy()
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    return error
  }
}

/**
 * Imports a single HM Ingredient and its components.
 * @param {Object} item - { name, yield, ingredients: [{name, amount}] }
 * @param {Array} dbIngredients - List of existing Raw Ingredients
 */
export const importHmIngredientFromCSV = async (item, dbIngredients) => {
  try {
    // Check for Duplicate (Case-Insensitive)
    const existing = await executeQuery(
      'SELECT hm_ingredient_id FROM hm_ingredients WHERE LOWER(name) = LOWER(?) AND is_deleted = 0;',
      [item.name],
    )

    if (existing?.result?.resultRows?.length > 0) {
      console.log(`Skipping duplicate HM item: ${item.name}`)
      return { success: false, name: item.name, error: 'Duplicate item already exists' }
    }

    // Match Components & Calculate Cost
    let calculatedCost = 0
    const ingredientInserts = []
    const unknownIngredients = []

    for (const comp of item.ingredients) {
      // Normalize names for comparison
      const targetName = comp.name.trim().toLowerCase()

      const match = dbIngredients.find((dbIng) => dbIng.name.trim().toLowerCase() === targetName)

      if (match) {
        // Found matching raw ingredient
        ingredientInserts.push({ id: match.ingredient_id, qty: comp.amount })
        calculatedCost += match.cost * comp.amount
      } else {
        // No match found
        console.warn(`Mismatch: CSV has '${comp.name}', DB has no match.`)
        unknownIngredients.push(comp.name)
      }
    }

    // Final Unit Cost (Total Batch Cost / Yield)
    // If yield is 0 or missing, avoid division by zero
    const finalYield = item.yield > 0 ? item.yield : 1
    const unitCost = calculatedCost / finalYield

    // Create HM Ingredient Record
    let result = await executeQuery(
      'INSERT INTO hm_ingredients (name, cost, notes, unit, yield, image, is_stocked) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [item.name, unitCost.toFixed(4), '', 'ml', item.yield, null, 1],
    )
    const hmId = Number(result?.result.lastInsertRowId)

    if (!hmId) throw new Error('Failed to create HM record')

    // Insert Components
    if (ingredientInserts.length > 0) {
      const values = ingredientInserts.map((i) => `(${hmId}, ${i.id}, ${i.qty})`).join(',')
      const query = `
        INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity)
        VALUES ${values};
      `
      await executeQuery(query)
    }

    return { success: true, name: item.name, unknowns: unknownIngredients }
  } catch (error) {
    console.error('Import Error for ' + item.name, error)
    return { success: false, name: item.name, error: error.message }
  }
}
