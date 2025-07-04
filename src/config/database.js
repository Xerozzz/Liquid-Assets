export const databaseConfig = {
  filename: 'file:mydb.sqlite3?vfs=opfs',
  tables: {
    test: {
      name: 'test_table',
      schema: `
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    },
    glassware: {
      name: 'glassware',
      schema: `
      CREATE TABLE IF NOT EXISTS glassware (
        glass_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        volume INTEGER NOT NULL,
        volume_w_ice INTEGER NOT NULL,
        is_deleted BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
      `
    },
    ingredients: {
      name: 'ingredients',
      schema: `
      CREATE TABLE IF NOT EXISTS ingredients (
        ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cost REAL NOT NULL,
        unit_cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        is_stocked BOOLEAN,
        is_deleted BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
      `
    },
    hm_ingredients: {
      name: 'hm_ingredients',
      schema: `
        CREATE TABLE IF NOT EXISTS hm_ingredients (
          hm_ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          cost REAL NOT NULL,
          unit_cost REAL NOT NULL,
          notes TEXT,
          photo BLOB,
          is_deleted BOOLEAN DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `
    },
    hm_ingredient_components: {
      name: 'hm_ingredients_components',
      schema: `
        CREATE TABLE IF NOT EXISTS hm_ingredient_components (
          hm_ingredient_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
          hm_ingredient_id INTEGER NOT NULL,
          ingredient_id INTEGER NOT NULL,
          quantity REAL,
          is_deleted BOOLEAN DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP,
          FOREIGN KEY (hm_ingredient_id) REFERENCES hm_ingredients(hm_ingredient_id),
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
        )
      `
    }
  },
} 
