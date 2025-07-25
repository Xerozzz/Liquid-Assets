import { useSQLite } from "@/composables/useSQLite";
const { executeQuery } = useSQLite()

export const getRecipeIngredients = async () => {
    try {
        let result = await executeQuery('SELECT * FROM recipe_ingredient;')
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getRecipeIngredientById = async (recipe_ingredient_id) => {
    try {
        let result = await executeQuery('SELECT * FROM recipe_ingredient where recipe_ingredient_id = ?',
            [recipe_ingredient_id]
        )
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createRecipeIngredient = async (recipe_id, ingredient_id, quantity) => {
    try {
        let result = await executeQuery('INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES (?,?,?)',
            [recipe_id, ingredient_id, quantity]
        )
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateRecipeIngredient = async (recipe_id, ingredient_id, quantity, recipe_ingredient_id) => {
    try {
        let result = await executeQuery('UPDATE recipe_ingredient SET recipe_id = ?, ingredient_id = ?, quantity = ?, WHERE recipe_ingredient_id = 1;',
            [recipe_id, ingredient_id, quantity,  recipe_ingredient_id]
        )
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteRecipeIngredient = async (recipe_ingredient_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM recipe_ingredient WHERE recipe_ingredient_id = ?;',
            [recipe_ingredient_id])
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}