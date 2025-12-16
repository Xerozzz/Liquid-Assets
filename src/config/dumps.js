// dumps.js

export const dumps = [
  /** * 1. Test Table
   * Simple connectivity check.
   */
  {
    schema: 'test_table',
    query: `
      DELETE FROM test_table;
      INSERT INTO test_table (id, name) VALUES
      (1, 'System Ready'),
      (2, 'Database Seeded');
    `,
  },

  /** * 2. Glassware
   * varied volumes to test liquid vs ice capacity logic.
   */
  {
    schema: 'glassware',
    query: `
      DELETE FROM glassware;
      INSERT INTO glassware (glass_id, name, brand, model, volume, volume_w_ice, is_deleted) VALUES
      (1, 'Double Rocks', 'Spiegelau', 'Perfect Serve', 360, 240, 0),
      (2, 'Nick & Nora', 'Riedel', 'Drink Specific', 140, 110, 0),
      (3, 'Highball', 'Libbey', 'Chicago', 300, 200, 0),
      (4, 'Coupe', 'Luminarc', 'Barcraft', 220, 180, 0),
      (5, 'Tiki Mug', 'Generic', 'Ceramic', 450, 350, 0);
    `,
  },

  /** * 3. Ingredients (Raw)
   * Includes Spirits, Citrus, Pantry items, and Modifiers.
   * Note: Some items are deliberately set to is_stocked = 0 to test UI warnings.
   */
  {
    schema: 'ingredients',
    query: `
      DELETE FROM ingredients;
      INSERT INTO ingredients (ingredient_id, name, cost, unit, is_stocked, is_deleted) VALUES
      -- Spirits
      (1, 'London Dry Gin', 0.05, 'ml', 1, 0),
      (2, 'Bourbon Whiskey', 0.07, 'ml', 1, 0),
      (3, 'White Rum', 0.04, 'ml', 1, 0),
      (4, 'Tequila Blanco', 0.06, 'ml', 1, 0),
      (5, 'Campari', 0.05, 'ml', 1, 0),
      (6, 'Sweet Vermouth', 0.03, 'ml', 1, 0),
      (7, 'Green Chartreuse', 0.12, 'ml', 0, 0), -- Expensive & Out of stock

      -- Citrus & Fresh
      (8, 'Lemon Juice', 0.01, 'ml', 1, 0),
      (9, 'Lime Juice', 0.01, 'ml', 1, 0),
      (10, 'Orange Peel', 0.10, 'piece', 1, 0),
      (11, 'Mint Leaves', 0.05, 'sprig', 1, 0),

      -- Pantry / Mixers
      (12, 'White Sugar', 0.002, 'g', 1, 0),
      (13, 'Water', 0.00, 'ml', 1, 0),
      (14, 'Honey', 0.02, 'g', 1, 0),
      (15, 'Soda Water', 0.01, 'ml', 1, 0),
      (16, 'Angostura Bitters', 0.50, 'dash', 1, 0);
    `,
  },

  /** * 4. Homemade Ingredients (HM)
   * Derived ingredients.
   */
  {
    schema: 'hm_ingredients',
    query: `
      DELETE FROM hm_ingredients;
      INSERT INTO hm_ingredients (hm_ingredient_id, name, cost, yield, notes, unit, image, is_stocked, is_deleted) VALUES
      -- ID 1: Simple Syrup (1:1 Ratio)
      (1, 'Simple Syrup', 0.0, 500, 'Standard 1:1 sugar to water ratio.', 'ml', null, 1, 0),

      -- ID 2: Honey Syrup (3:1 Ratio)
      (2, 'Honey Syrup', 0.0, 300, 'Rich honey syrup for penicillin/bees knees.', 'ml', null, 1, 0),

      -- ID 3: Super Lime Juice (Hypothetical, complex yield)
      (3, 'Lime Cordial', 0.0, 250, 'Acid adjusted lime cordial.', 'ml', null, 0, 0); -- Out of stock
    `,
  },

  /** * 5. Homemade Components
   * Links Raw Ingredients to HM Ingredients.
   * This allows calculating the REAL cost of the homemade item based on raw costs.
   */
  {
    schema: 'hm_ingredient_components',
    query: `
      DELETE FROM hm_ingredient_components;
      -- 1. Simple Syrup (250g Sugar + 250ml Water)
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (1, 12, 250), -- Sugar
      (1, 13, 250); -- Water

      -- 2. Honey Syrup (225g Honey + 75ml Water)
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (2, 14, 225), -- Honey
      (2, 13, 75);  -- Water

      -- 3. Lime Cordial (Lime Juice + Sugar)
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (3, 9, 150),  -- Lime Juice
      (3, 12, 100); -- Sugar
    `,
  },

  /** * 6. Recipes
   * The actual cocktails.
   */
  {
    schema: 'recipe',
    query: `
      DELETE FROM recipe;
      INSERT INTO recipe (recipe_id, name, glass_id, step_to_make, garnish, notes, image, is_deleted) VALUES

      -- 1. Negroni (All raw ingredients)
      (1, 'Negroni', 1, 'Add all ingredients to mixing glass with ice. Stir until chilled. Strain over large rock.', 'Orange Peel', 'The classic aperitivo.', null, 0),

      -- 2. Daiquiri (Raw + HM Ingredient)
      (2, 'Daiquiri', 4, 'Add Rum, Lime, and Syrup to shaker. Shake hard with ice. Double strain.', 'Lime Wheel', 'Adjust syrup based on lime acidity.', null, 0),

      -- 3. Old Fashioned (Raw + HM + Different Units)
      (3, 'Old Fashioned', 1, 'Add syrup and bitters. Add Whiskey. Stir with ice.', 'Orange Peel', 'Use high proof bourbon.', null, 0),

      -- 4. Bee''s Knees (Uses Honey Syrup HM)
      (4, 'Bee''s Knees', 2, 'Shake all ingredients with ice. Fine strain.', 'Lemon Twist', 'Gin sour variation.', null, 0),

      -- 5. The Last Word (Contains an OUT OF STOCK ingredient)
      (5, 'The Last Word', 4, 'Shake all ingredients with ice.', 'Luxardo Cherry', 'Equal parts classic.', null, 0);
    `,
  },

  /** * 7. Recipe Ingredients (Raw)
   * Linking Recipes to Raw Ingredients.
   */
  {
    schema: 'recipe_ingredient',
    query: `
      DELETE FROM recipe_ingredient;

      -- 1. Negroni
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (1, 1, 30), -- Gin
      (1, 5, 30), -- Campari
      (1, 6, 30); -- Sweet Vermouth

      -- 2. Daiquiri
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (2, 3, 60), -- White Rum
      (2, 9, 30); -- Lime Juice

      -- 3. Old Fashioned
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (3, 2, 60), -- Bourbon
      (3, 16, 2); -- Angostura (Dashes)

      -- 4. Bee's Knees
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (4, 1, 60), -- Gin
      (4, 8, 22.5); -- Lemon Juice

      -- 5. The Last Word (Testing missing stock logic)
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (5, 1, 22.5), -- Gin
      (5, 7, 22.5), -- Green Chartreuse (Stocked = 0)
      (5, 9, 22.5); -- Lime
      -- (Missing Maraschino in DB, intentionally left incomplete to test UI)
    `,
  },

  /** * 8. Recipe Homemade Ingredients
   * Linking Recipes to Homemade Ingredients.
   */
  {
    schema: 'recipe_hm_ingredient',
    query: `
      DELETE FROM recipe_hm_ingredient;

      -- 2. Daiquiri uses Simple Syrup
      INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES
      (2, 1, 22.5); -- Simple Syrup

      -- 3. Old Fashioned uses Simple Syrup
      INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES
      (3, 1, 5); -- Simple Syrup (just a spoon)

      -- 4. Bee's Knees uses Honey Syrup
      INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES
      (4, 2, 22.5); -- Honey Syrup
    `,
  },
]
