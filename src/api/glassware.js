import { useSQLite } from "@/composables/useSQLite";
const { executeQuery, destroy } = useSQLite()

export const getGlassware = async () => {
    try {
        let result = await executeQuery('SELECT * FROM glassware;')
        destroy()
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getGlasswareById = async (glassware_id) => {
    try {
        let result = await executeQuery(
            'SELECT * FROM glassware WHERE glass_id = ?;',
            [glassware_id])
        destroy()
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createGlassware = async (name, brand, model, volume, volume_w_ice) => {
    try {
        let result = await executeQuery(
            'INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES (?, ?, ?, ?, ?)',
            [name, brand, model, volume, volume_w_ice])
        destroy()
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateGlassware = async (name, brand, model, volume, volume_w_ice, glass_id) => {
    try {
        let result = await executeQuery(
            'UPDATE glassware SET name = ?, brand = ?, model = ?, volume = ?, volume_w_ice = ? WHERE glass_id = ?;',
            [name, brand, model, volume, volume_w_ice, glass_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteGlassware = async (glassware_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM glassware WHERE glassware_id = ?;',
            [glassware_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}