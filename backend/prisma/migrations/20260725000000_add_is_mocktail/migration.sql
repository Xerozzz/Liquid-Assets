-- Distinguish mocktails from cocktails on the same recipe table
ALTER TABLE "recipe" ADD COLUMN "is_mocktail" BOOLEAN NOT NULL DEFAULT false;
