import { useSQLite } from '@/composables/useSQLite'
const { executeQuery, destroy } = useSQLite()

export const getGlassware = async () => {
  try {
    let result = await executeQuery('SELECT * FROM glassware;')
    return result?.result.resultRows
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    destroy()
  }
}

export const getGlasswareById = async (id) => {
  try {
    let result = await executeQuery('SELECT * FROM glassware WHERE glass_id = ?;', [id])
    return result?.result.resultRows.length > 0 ? result.result.resultRows[0] : null
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    destroy()
  }
}

export const createGlassware = async (brand, model, volume, volume_fill) => {
  try {
    const name = `${brand} ${model}`

    let result = await executeQuery(
      'INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES (?, ?, ?, ?, ?)',
      [name, brand, model, volume, volume_fill],
    )
    return Number(result?.result.lastInsertRowId)
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    destroy()
  }
}

export const updateGlassware = async (brand, model, volume, volume_fill, glass_id) => {
  try {
    const name = `${brand} ${model}`

    let result = await executeQuery(
      'UPDATE glassware SET name = ?, brand = ?, model = ?, volume = ?, volume_w_ice = ? WHERE glass_id = ?;',
      [name, brand, model, volume, volume_fill, glass_id],
    )
    return result
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    destroy()
  }
}

export const deleteGlassware = async (glass_id) => {
  try {
    let result = await executeQuery('DELETE FROM glassware WHERE glass_id = ?;', [glass_id])
    return result
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    destroy()
  }
}

/**
 * Bulk insert glassware from CSV import
 * @param {Array} rows - Array of objects {brand, model, volume, volume_w_ice}
 */
export const createMultipleGlassware = async (rows) => {
  try {
    if (!rows || rows.length === 0) return

    // Create placeholders: (?,?,?,?,?), (?,?,?,?,?)...
    // We insert: name, brand, model, volume, volume_w_ice
    const placeholders = rows.map(() => '(?, ?, ?, ?, ?)').join(',')

    // Flatten data
    const flatValues = rows.flatMap((r) => [
      `${r.brand} ${r.model}`, // name (derived)
      r.brand,
      r.model,
      r.volume,
      r.volume_w_ice,
    ])

    const query = `INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES ${placeholders};`

    let result = await executeQuery(query, flatValues)
    destroy()
    return result
  } catch (error) {
    console.error('Bulk Insert Glassware Error:', error)
    throw error
  }
}
