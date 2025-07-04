export const queries = [
    // { title: 'Select all', query: 'SELECT * FROM test_table' },
    // { title: 'Insert', query: "INSERT INTO test_table (name) VALUES ('New Test Item')" },
    // { title: 'Update', query: "UPDATE test_table SET name = 'Updated Item' WHERE name LIKE 'New%'" },
    // { title: 'Delete', query: "DELETE FROM test_table WHERE name = 'Updated Item'" },
    // { title: 'Sort', query: 'SELECT * FROM test_table ORDER BY created_at DESC' },
    // { title: 'Filter', query: "SELECT * FROM test_table WHERE created_at > date('now', '-1 day')" },
    /** Glassware */
    { title: 'select glassware', query: 'SELECT * FROM glassware' },
    {
        title: 'insert glassware',
        query:
            "INSERT INTO glassware (name, brand, model, volume, volume_w_ice) VALUES ('test','test','test', 1,1)",
    },
    {
        title: 'update glassware',
        query: "UPDATE glassware SET name = 'test1' WHERE glass_id = 1;",
    },
    {
        title: 'delete glassware',
        query: 'DELETE FROM glassware WHERE glass_id = 2;',
    },
    /** Ingredients */
    { title: 'select ingredients', query: 'SELECT * FROM ingredients' },
    {
        title: 'insert ingredients',
        query:
            "INSERT INTO ingredients (name, cost, unit_cost, quantity, is_stocked) VALUES ('test',1.1,1.1,1,1) ",
    },
    {
        title: 'update ingredients',
        query: "UPDATE ingredients SET name = 'test1' WHERE ingredient_id = 1;",
    },
    {
        title: 'delete ingredients',
        query: 'DELETE FROM ingredients WHERE ingredient_id = 2;',
    },
    /** HM Ingredients */
    { title: 'select hm_ingredients', query: 'SELECT * FROM hm_ingredients' },
    {
        title: 'insert hm_ingredients',
        query:
            "INSERT INTO hm_ingredients (name, cost, unit_cost, notes, image) VALUES ('test',1.1,1.1,'hello world','base64 images is cursed') ",
    },
    {
        title: 'update hm_ingredients',
        query:
            "UPDATE hm_ingredients SET image = 'base64 images is awesome' WHERE hm_ingredient_id = 1; ",
    },
    {
        title: 'delete hm_ingredients',
        query:
            "DELETE FROM hm_ingredients WHERE hm_ingredient_id = 1;",
    },
    /** HM Ingredients components*/
    { title: 'select hm_ingredient_components', query: 'SELECT * FROM hm_ingredient_components' },
    {
        title: 'insert hm_ingredient_components',
        query:
            "INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES (3,2,1) ",
    },
    {
        title: 'update hm_ingredient_components',
        query:
            "UPDATE hm_ingredient_components SET hm_ingredient_id = 4, ingredient_id = 2 WHERE hm_ingredient_component_id = 1;",
    },
    {
        title: 'delete hm_ingredient_components',
        query:
            "DELETE FROM hm_ingredient_components WHERE hm_ingredient_component_id = 1;",
    },
    /** recipe */
    { title: 'select recipe', query: 'SELECT * FROM recipe' },
    {
        title: 'insert recipe',
        query:
            "INSERT INTO recipe (name, glass_id, step_to_make, image) VALUES ('cocktail', 1, 'mix it', 'no image') ",
    },
    {
        title: 'update recipe',
        query:
            "UPDATE recipe SET name = 'cocktail2' WHERE recipe_id = 1;",
    },
    {
        title: 'delete recipe',
        query:
            "DELETE FROM recipe WHERE recipe_id = 1;",
    },
    /** recipe ingredients */
    { title: 'select recipe_ingredient', query: 'SELECT * FROM recipe_ingredient' },
    {
        title: 'insert recipe_ingredient',
        query:
            "INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES (1,1,1) ",
    },
    {
        title: 'update recipe_ingredient',
        query:
            "UPDATE recipe_ingredient SET recipe_id = 2 WHERE recipe_ingredient_id = 1;",
    },
    {
        title: 'delete recipe_ingredient',
        query:
            "DELETE FROM recipe_ingredient WHERE recipe_ingredient = 1;",
    },
    /**  recipe hm ingredients */
    { title: 'select recipe_hm_ingredient', query: 'SELECT * FROM recipe_hm_ingredient' },
    { title: 'insert recipe_hm_ingredient', query: 'INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES (1,1,1) '},
        {
        title: 'update recipe_hm_ingredient',
        query:
            "UPDATE recipe_hm_ingredient SET recipe_id = 2 WHERE recipe_hm_ingredient_id = 1;",
    },
    {
        title: 'delete recipe_hm_ingredient',
        query:
            "DELETE FROM recipe_hm_ingredient WHERE recipe_hm_ingredient_id = 1;",
    },
]
