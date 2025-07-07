import { useSQLite } from "@/composables/useSQLite";
const { executeQuery } = useSQLite()

export const getIngredients = async () => {
    try {
        let result = await executeQuery('SELECT * FROM ingredients;')
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getIngredientById = async (ingredient_id) => {
    try {
        let result = await executeQuery(
            'SELECT * FROM ingredients WHERE ingredient_id = ?;',
            [ingredient_id])
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createIngredient = async (name, cost, quantity, is_stocked) => {
    try {
        let result = await executeQuery(
            'INSERT INTO ingredients (name, cost, quantity, is_stocked) VALUES (?, ?, ?, ?);',
            [name, cost, quantity, is_stocked])
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateIngredient = async (name, cost, quantity, is_stocked, ingredient_id) => {
    try {
        let result = await executeQuery(
            'UPDATE ingredients SET name = ?, cost = ?, quantity = ?, is_stocked = ? WHERE ingredient_id = ?;',
            [name, cost, quantity, is_stocked, ingredient_id])
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteIngredient = async (ingredient_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM ingredients WHERE ingredient_id = ?;',
            [ingredient_id])
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}