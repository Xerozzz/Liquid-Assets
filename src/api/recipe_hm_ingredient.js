import { useSQLite } from "@/composables/useSQLite";
const { executeQuery, destroy } = useSQLite();

export const getRecipeHmIngredient = async () => {
    try {
        let result = await executeQuery('SELECT * FROM recipe_hm_ingredient;')
        destroy()
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getRecipeHmIngredientById = async (recipe_hm_ingredient_id) => {
    try {
        let result = await executeQuery('SELECT * FROM recipe_hm_ingredient WHERE recipe_hm_ingredient_id = ?',
            [recipe_hm_ingredient_id]
        );
        destroy()
        return result?.result.resultRows[0]
    } catch (error) {
        console.log(error);
        return error
    }
}

export const getRecipeHmIngredientByRecipeId = async (recipe_id) => {
    try {
        let result = await executeQuery(`
            SELECT rhi.recipe_id,
            rhi.recipe_hm_ingredient_id,
            rhi.hm_ingredient_id,
            hi.name,
            rhi.quantity,
            hi.unit
            FROM recipe_hm_ingredient rhi 
            JOIN hm_ingredients hi ON rhi.hm_ingredient_id = hi.hm_ingredient_id
            WHERE rhi.recipe_id = ?;
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

export const createRecipeHmIngredient = async (recipe_id, hm_ingredient_id, quantity) => {
    try {
        let result = await executeQuery('INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES (1,1,1)',
            [recipe_id, hm_ingredient_id, quantity])
        destroy()
        return Number(result?.result.lastInsertRowId)
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createMultipleRecipeHmIngredient = async (rows) => {
    try {
        const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
        const values = rows.flatMap(row => [row.recipe_id, row.hm_ingredient_id, row.selected_quantity
        ]);

        let result = await executeQuery(
            `INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES ${placeholders} 
            ON CONFLICT(recipe_id, hm_ingredient_id) 
            DO UPDATE SET 
                recipe_id = excluded.recipe_id, 
                hm_ingredient_id = excluded.hm_ingredient_id,
                quantity = quantity
            `, values)
        console.log(result)
        destroy()
        return result
    } catch (error) {
        console.log(error)
        return error
    }
}

export const updateRecipeHmIngredient = async (recipe_id, hm_ingredient_id, quantity, recipe_hm_ingredient_id) => {
    try {
        let result = await executeQuery('UPDATE recipe_hm_ingredient SET recipe_id = ?, hm_ingredient_id = ?, quantity = ? WHERE recipe_hm_ingredient_id = ?;',
            [recipe_id, hm_ingredient_id, quantity, recipe_hm_ingredient_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteRecipeHmIngredient = async (recipe_hm_ingredient_id) => {
    try {
        let result = await executeQuery(
            'DELETE FROM recipe_hm_ingredient WHERE recipe_hm_ingredient_id = ?;',
            [recipe_hm_ingredient_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}

export const deleteRecipeHmIngredientByRecipeId = async (recipe_id) => {
    try {
        let result = await executeQuery(
            'UPDATE recipe_hm_ingredient SET is_deleted = 1, deleted_at = datetime() WHERE recipe_id = ?;',
            [recipe_id])
        destroy()
        return result
    } catch (error) {
        console.log(error);
        return error
    }
}