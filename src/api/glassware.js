import { useSQLite } from '@/composables/useSQLite'

export const getGlassware = async () => {
  const { executeQuery, destroy } = useSQLite()
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
  const { executeQuery, destroy } = useSQLite()
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
  const { executeQuery, destroy } = useSQLite()
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
  const { executeQuery, destroy } = useSQLite()
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
  const { executeQuery, destroy } = useSQLite()
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
