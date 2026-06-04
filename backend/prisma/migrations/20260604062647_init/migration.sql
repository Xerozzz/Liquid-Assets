-- CreateTable
CREATE TABLE "ingredients" (
    "ingredient_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "is_stocked" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("ingredient_id")
);

-- CreateTable
CREATE TABLE "glassware" (
    "glass_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "volume_w_ice" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "glassware_pkey" PRIMARY KEY ("glass_id")
);

-- CreateTable
CREATE TABLE "hm_ingredients" (
    "hm_ingredient_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "yield" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "unit" TEXT NOT NULL,
    "image" TEXT,
    "is_stocked" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hm_ingredients_pkey" PRIMARY KEY ("hm_ingredient_id")
);

-- CreateTable
CREATE TABLE "hm_ingredient_components" (
    "hm_ingredient_component_id" SERIAL NOT NULL,
    "hm_ingredient_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hm_ingredient_components_pkey" PRIMARY KEY ("hm_ingredient_component_id")
);

-- CreateTable
CREATE TABLE "recipe" (
    "recipe_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "glass_id" INTEGER NOT NULL,
    "step_to_make" TEXT NOT NULL,
    "garnish" TEXT,
    "notes" TEXT,
    "image" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recipe_pkey" PRIMARY KEY ("recipe_id")
);

-- CreateTable
CREATE TABLE "recipe_ingredient" (
    "recipe_ingredient_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recipe_ingredient_pkey" PRIMARY KEY ("recipe_ingredient_id")
);

-- CreateTable
CREATE TABLE "recipe_hm_ingredient" (
    "recipe_hm_ingredient_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "hm_ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recipe_hm_ingredient_pkey" PRIMARY KEY ("recipe_hm_ingredient_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hm_ingredient_components_hm_ingredient_id_ingredient_id_key" ON "hm_ingredient_components"("hm_ingredient_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredient_recipe_id_ingredient_id_key" ON "recipe_ingredient"("recipe_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_hm_ingredient_recipe_id_hm_ingredient_id_key" ON "recipe_hm_ingredient"("recipe_id", "hm_ingredient_id");

-- AddForeignKey
ALTER TABLE "hm_ingredient_components" ADD CONSTRAINT "hm_ingredient_components_hm_ingredient_id_fkey" FOREIGN KEY ("hm_ingredient_id") REFERENCES "hm_ingredients"("hm_ingredient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_ingredient_components" ADD CONSTRAINT "hm_ingredient_components_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("ingredient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_glass_id_fkey" FOREIGN KEY ("glass_id") REFERENCES "glassware"("glass_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("recipe_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("ingredient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_hm_ingredient" ADD CONSTRAINT "recipe_hm_ingredient_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("recipe_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_hm_ingredient" ADD CONSTRAINT "recipe_hm_ingredient_hm_ingredient_id_fkey" FOREIGN KEY ("hm_ingredient_id") REFERENCES "hm_ingredients"("hm_ingredient_id") ON DELETE RESTRICT ON UPDATE CASCADE;
