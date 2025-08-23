import { useSQLite } from "@/composables/useSQLite";
const { executeQuery, destroy } = useSQLite()

export const getRecipeIngredients = async () => {
    try {
        let result = await executeQuery('SELECT * FROM recipe_ingredient;')
        destroy()
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
        destroy()
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getRecipeIngredientByRecipeId = async (recipe_id) => {
    try {
        let result = await executeQuery(`
            SELECT ri.recipe_id,
            ri.recipe_ingredient_id,
            ri.ingredient_id,
            ri.quantity,
            i.name,
            i.unit
            FROM recipe_ingredient ri
            JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
            WHERE ri.recipe_id = ?;
            `,
            [recipe_id]
        )
        destroy()
        return result?.result.resultRows
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
        destroy()
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createMultipleRecipeIngredient = async (rows) => {
    try {
        const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
        const values = rows.flatMap(row => [row.recipe_id, row.ingredient_id, row.selected_quantity
        ]);

        let result = await executeQuery(
            `INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES ${placeholders} 
            ON CONFLICT(recipe_id, ingredient_id) 
            DO UPDATE SET 
                recipe_id = excluded.recipe_id, 
                ingredient_id = excluded.ingredient_id,
                quantity = quantity
            `, values)
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const updateRecipeIngredient = async (recipe_id, ingredient_id, quantity, recipe_ingredient_id) => {
    try {
        let result = await executeQuery('UPDATE recipe_ingredient SET recipe_id = ?, ingredient_id = ?, quantity = ?, WHERE recipe_ingredient_id = 1;',
            [recipe_id, ingredient_id, quantity, recipe_ingredient_id]
        )
        destroy()
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
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteRecipeIngredientByRecipeId = async (recipe_id) => {
    try {
        let result = await executeQuery(
            'UPDATE recipe_ingredient SET is_deleted = 1, deleted_at = datetime() WHERE recipe_id = ?;',
            [recipe_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}