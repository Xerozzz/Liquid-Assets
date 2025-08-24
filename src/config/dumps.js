// dumps.js
export const dumps = [
  /** test_table */
  {
    schema: 'test_table',
    query: `
      INSERT INTO test_table (name) VALUES
      ('Smoke test A'),
      ('Smoke test B'),
      ('Smoke test C');
    `,
  },

  /** glassware */
  {
    schema: 'glassware',
    query: `
      INSERT INTO glassware (name, brand, model, volume, volume_w_ice, is_deleted) VALUES
      ('Highball', 'Libbey', 'Classic', 350, 280, 0),
      ('Martini', 'Riedel', 'Vinum', 200, 160, 0),
      ('Rocks',   'Spiegelau', 'Perfect Serve', 300, 220, 0),
      ('Coupe',   'Nick & Nora', 'Vintage', 180, 150, 0);
    `,
  },

  /** ingredients (base / store-bought) */
  {
    schema: 'ingredients',
    query: `
      INSERT INTO ingredients (name, cost, quantity, unit, is_stocked, is_deleted) VALUES
      ('Vodka',             26.00, 1000, 'ml', 1, 0),  -- id:1
      ('Gin',               30.00, 1000, 'ml', 1, 0),  -- id:2
      ('Lime Juice',         6.50,  500, 'ml', 1, 0),  -- id:3
      ('Tonic Water',        3.20, 1000, 'ml', 1, 0),  -- id:4
      ('Dry Vermouth',      12.00,  750, 'ml', 0, 0),  -- id:5 (out of stock)
      ('Sugar',              1.80, 1000, 'g',  1, 0),  -- id:6
      ('Water',              0.10, 2000, 'ml', 1, 0),  -- id:7
      ('Pomegranate Juice',  5.50,  500, 'ml', 0, 0),  -- id:8 (out of stock)
      ('Ginger',             2.40,  300, 'g',  1, 0);  -- id:9
    `,
  },

  /** hm_ingredients (house-made) */
  {
    schema: 'hm_ingredients',
    query: `
      INSERT INTO hm_ingredients (name, cost, notes, unit, image, is_stocked, is_deleted) VALUES
      ('Simple Syrup',  1.20, '1:1 sugar:water by weight', 'ml', 'no image', 1, 0),  -- id:1
      ('Grenadine',     2.60, 'Pomegranate + sugar + water', 'ml', 'no image', 0, 0), -- id:2 (not stocked)
      ('Ginger Syrup',  2.10, 'Ginger macerate + sugar + water', 'ml', 'no image', 1, 0); -- id:3
    `,
  },

  /** hm_ingredient_components (composition of house-made items) */
  {
    schema: 'hm_ingredient_components',
    query: `
      -- Simple Syrup = Sugar + Water
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (1, 6, 500.0),  -- 500 g Sugar
      (1, 7, 500.0);  -- 500 ml Water

      -- Grenadine = Pomegranate Juice + Sugar + Water
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (2, 8, 400.0),
      (2, 6, 400.0),
      (2, 7, 200.0);

      -- Ginger Syrup = Ginger + Sugar + Water
      INSERT INTO hm_ingredient_components (hm_ingredient_id, ingredient_id, quantity) VALUES
      (3, 9, 150.0),
      (3, 6, 300.0),
      (3, 7, 300.0);
    `,
  },

  /** recipe */
  {
    schema: 'recipe',
    query: `
      INSERT INTO recipe (name, glass_id, step_to_make, garnish, notes, image, is_deleted) VALUES
      -- Uses Highball (glass_id = 1)
      ('Vodka Tonic', 1,
        'Add ice to highball. Pour vodka, top with tonic. Brief stir.',
        'Lime wedge', 'Keep effervescence by gentle stir.', 'no image', 0),

      -- Uses Martini (glass_id = 2)
      ('Dry Martini', 2,
        'Stir gin with dry vermouth over ice ~20s. Strain into chilled martini glass.',
        'Olive or lemon twist', 'Adjust vermouth to preference.', 'no image', 0),

      -- Uses Coupe (glass_id = 4)
      ('Gimlet', 4,
        'Shake gin, lime juice, and simple syrup with ice. Fine strain.',
        'Lime wheel', '2:1:1 is a nice starting point.', 'no image', 0);
    `,
  },

  /** recipe_ingredient (store-bought components per recipe) */
  {
    schema: 'recipe_ingredient',
    query: `
      -- Vodka Tonic (recipe_id = 1)
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (1, 1, 50),   -- Vodka 50 ml
      (1, 4, 120),  -- Tonic 120 ml
      (1, 3, 10);   -- Lime juice 10 ml

      -- Dry Martini (recipe_id = 2)
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (2, 2, 60),   -- Gin 60 ml
      (2, 5, 10);   -- Dry Vermouth 10 ml (note: ingredient may be unstocked)

      -- Gimlet (recipe_id = 3)
      INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity) VALUES
      (3, 2, 50),   -- Gin 50 ml
      (3, 3, 20);   -- Lime juice 20 ml
    `,
  },

  /** recipe_hm_ingredient (house-made components per recipe) */
  {
    schema: 'recipe_hm_ingredient',
    query: `
      -- Vodka Tonic uses no HM ingredients

      -- Dry Martini uses no HM ingredients

      -- Gimlet (recipe_id = 3)
      INSERT INTO recipe_hm_ingredient (recipe_id, hm_ingredient_id, quantity) VALUES
      (3, 1, 15);   -- Simple Syrup 15 ml
    `,
  },
]
