-- Drop soft-delete columns from join tables (hard-delete only from here on)
ALTER TABLE "hm_ingredient_components"
  DROP COLUMN IF EXISTS "is_deleted",
  DROP COLUMN IF EXISTS "deleted_at";

ALTER TABLE "recipe_ingredient"
  DROP COLUMN IF EXISTS "is_deleted",
  DROP COLUMN IF EXISTS "deleted_at";

ALTER TABLE "recipe_hm_ingredient"
  DROP COLUMN IF EXISTS "is_deleted",
  DROP COLUMN IF EXISTS "deleted_at";

-- Tighten cascade behavior so recipes/hm-ingredients delete their join rows automatically.
ALTER TABLE "hm_ingredient_components"
  DROP CONSTRAINT IF EXISTS "hm_ingredient_components_hm_ingredient_id_fkey",
  ADD CONSTRAINT "hm_ingredient_components_hm_ingredient_id_fkey"
    FOREIGN KEY ("hm_ingredient_id") REFERENCES "hm_ingredients"("hm_ingredient_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipe_ingredient"
  DROP CONSTRAINT IF EXISTS "recipe_ingredient_recipe_id_fkey",
  ADD CONSTRAINT "recipe_ingredient_recipe_id_fkey"
    FOREIGN KEY ("recipe_id") REFERENCES "recipe"("recipe_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipe_hm_ingredient"
  DROP CONSTRAINT IF EXISTS "recipe_hm_ingredient_recipe_id_fkey",
  ADD CONSTRAINT "recipe_hm_ingredient_recipe_id_fkey"
    FOREIGN KEY ("recipe_id") REFERENCES "recipe"("recipe_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
