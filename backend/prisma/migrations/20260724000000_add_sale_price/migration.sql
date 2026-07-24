-- Add sale price to recipes for cost/margin tracking
ALTER TABLE "recipe" ADD COLUMN "sale_price" DOUBLE PRECISION;
