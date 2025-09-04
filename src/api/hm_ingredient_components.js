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

export const getHmIngredientComponentByHmIngredientId = async (hm_ingredient_id) => {
    try {
        let result = await executeQuery(`
            SELECT
                i.unit,
                i.name,
                i.cost,
                hic.hm_ingredient_component_id,
                hic.ingredient_id,
                hic.quantity
            FROM hm_ingredient_components hic
            INNER JOIN ingredients i ON hic.ingredient_id = i.ingredient_id
            WHERE hic.hm_ingredient_id = ?;
            `,
            [hm_ingredient_id])
        destroy()
        return result?.result.resultRows
    } catch (error) {
        console.log(error);
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

export const createMultipleHmIngredientComponents = async (rows) => {
    try {
        const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
        const values = rows.flatMap(row => [
            row.hm_ingredient_id,
            row.ingredient_id,
            row.selected_quantity
        ]);

        // Delete rows not present in the new data for the given hm_ingredient_id
        if (rows.length > 0) {
            const hmIngredientId = rows[0].hm_ingredient_id;
            const ingredientIds = rows.map(row => row.ingredient_id);
            const placeholdersForDelete = ingredientIds.map(() => '?').join(', ');
            await executeQuery(
                `DELETE FROM hm_ingredient_components 
                 WHERE hm_ingredient_id = ? 
                 AND ingredient_id NOT IN (${placeholdersForDelete})`,
                [hmIngredientId, ...ingredientIds]
            );
        }

        // Insert or update existing rows
        let result = await executeQuery(
            `INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES ${placeholders} 
            ON CONFLICT(hm_ingredient_id, ingredient_id) 
            DO UPDATE SET 
            quantity = excluded.quantity`, values);

        destroy();
        return result;
    } catch (error) {
        console.log(error);
        return error;
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