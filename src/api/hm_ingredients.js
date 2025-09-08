import { useSQLite } from "@/composables/useSQLite";
const { executeQuery, destroy } = useSQLite()

export const getHmIngredient = async () => {
    try {
        let result = await executeQuery(`
            SELECT * FROM hm_ingredients WHERE is_deleted = 0;
        `)
        destroy()
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
        destroy()
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createHmIngredient = async (name, cost, notes, unit, hmYield, image, is_stocked) => {
    try {
        let result = await executeQuery(
            'INSERT INTO hm_ingredients (name, cost, notes, unit, yield, image, is_stocked) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, cost, notes, unit, hmYield, image, is_stocked])
        destroy()
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateHmIngredient = async (name, cost, notes, image, unit, hmYield, is_stocked, hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'UPDATE hm_ingredients SET name = ?, cost = ?, notes = ?, image = ?, unit = ?, yield = ?, is_stocked = ? WHERE hm_ingredient_id = ?;',
            [name, cost, notes, image, unit, hmYield, is_stocked, hm_ingredient_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteHmIngredient = async (hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'UPDATE hm_ingredients SET is_deleted = 1 WHERE hm_ingredient_id = ?;',
            [hm_ingredient_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getHmIngredientWithComponents = async (hm_ingredient_id) => {
    try {
        let result = await executeQuery(`
            WITH base AS (
                SELECT hm.hm_ingredient_id,
                       hm.name AS hm_ingredient_name,
                       hm.cost AS hm_ingredient_cost,
                       hm.unit AS hm_ingredient_unit,
                       hm.yield AS hm_ingredient_yield,
                       hm.notes AS hm_ingredient_notes,
                       hm.image AS hm_ingredient_image,
                       hm.is_stocked AS hm_ingredient_stock,
                       hm.created_at AS hm_ingredient_created_at
                FROM hm_ingredients hm
                WHERE hm.is_deleted = 0
                  AND hm.hm_ingredient_id = ?
            ),
            components AS (
                SELECT i.ingredient_id AS component_id,
                       i.name AS component_name,
                       i.cost AS component_cost,
                       i.unit AS component_unit,
                       i.is_stocked AS component_stock,
                       hmc.quantity AS component_quantity
                FROM hm_ingredient_components hmc
                JOIN ingredients i ON i.ingredient_id = hmc.ingredient_id
                WHERE hmc.is_deleted = 0
                  AND hmc.hm_ingredient_id = ?
            )
            SELECT b.*, c.*
            FROM base b
            CROSS JOIN components c
            ORDER BY c.component_name;
        `, [hm_ingredient_id, hm_ingredient_id])
        destroy()
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}