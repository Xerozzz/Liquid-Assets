import { useSQLite } from "@/composables/useSQLite";
const { executeQuery } = useSQLite()

export const getHmIngredient = async () => {
    try {
        let result = await executeQuery('SELECT * FROM hm_ingredients;')
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getHmIngredientById = async (hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'SELECT * FROM hm_ingredients WHERE hm_ingredient_id = ?;',
            [hm_ingredient_id])
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createHmIngredient = async (name, cost, notes, image, is_stocked) => {
    try {
        let result = await executeQuery(
            'INSERT INTO hm_ingredients (name, cost, notes, image, is_stocked) VALUES (?, ?, ?, ?, ?)',
        [name, cost, notes, image, is_stocked])
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateHmIngredient = async (name, cost, notes, image, is_stocked, hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'UPDATE hm_ingredients SET name = ?, cost = ?, notes = ?, image = ?, is_stocked = ? WHERE hm_ingredient_id = ?;',
        [name, cost, notes, image, is_stocked, hm_ingredient_id])
        return result 
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteHmIngredient = async (hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM hm_ingredients WHERE hm_ingredient_id = ?;',
        [hm_ingredient_id])
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}