import { useSQLite } from "@/composables/useSQLite";
const { executeQuery, destroy } = useSQLite()

export const getHmIngredientComponents = async () => {
    try {
        let result = await executeQuery('SELECT * FROM hm_ingredient_components;')
        destroy()
        return result?.result.resultRows
    } catch (error) {
        console.log(error)
        return error
    }
}

export const getHmIngredientComponentById = async (hm_ingredient_component_id) => {
    try {
        let result = await executeQuery(
            'SELECT * FROM hm_ingredient_components WHERE hm_ingredient_component_id = ?;',
            [hm_ingredient_component_id])
            destroy()
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error)
        return error
    }
}

export const createHmIngredientComponent = async (hm_ingredient_id, ingredient_id, quantity) => {
    try {
        let result = await executeQuery(
            'INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES (?, ?, ?);',
            [hm_ingredient_id, ingredient_id, quantity])
            destroy()
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error)
        return error
    }
}

export const updateHmIngredientComponent = async (hm_ingredient_id, ingredient_id, quantity, hm_ingredient_component_id) => {
    try {
        let result = await executeQuery(
            'UPDATE hm_ingredient_components SET hm_ingredient_id = ?, ingredient_id = ?, quantity = ? WHERE hm_ingredient_component_id = ?;',
            [hm_ingredient_id, ingredient_id, quantity, hm_ingredient_component_id])
            destroy()
        return result
    } catch (error) {
        console.log(error)
        return error
    }
}

export const deleteHmIngredientComponent = async (hm_ingredient_component_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM hm_ingredient_components WHERE hm_ingredient_component_id = ?;',
            [hm_ingredient_component_id])
            destroy()
        return result
    } catch (error) {
        console.log(error)
        return error
    }
}