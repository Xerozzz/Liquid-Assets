const normalizeDate = (value) => (value ? new Date(value).toISOString() : value)

export const mapIngredient = (i) => {
  if (!i) return i
  return {
    ingredient_id: i.ingredient_id ?? i.id,
    name: i.name,
    cost: i.cost,
    unit: i.unit,
    is_stocked: i.is_stocked ?? i.isStocked,
    is_deleted: i.is_deleted ?? i.isDeleted,
    created_at: i.created_at ?? normalizeDate(i.createdAt),
    deleted_at: i.deleted_at ?? normalizeDate(i.deletedAt),
  }
}

export const mapGlassware = (g) => {
  if (!g) return g
  return {
    glass_id: g.glass_id ?? g.id,
    name: g.name,
    brand: g.brand,
    model: g.model,
    volume: g.volume,
    volume_w_ice: g.volume_w_ice ?? g.volumeWIce,
    is_deleted: g.is_deleted ?? g.isDeleted,
    created_at: g.created_at ?? normalizeDate(g.createdAt),
    deleted_at: g.deleted_at ?? normalizeDate(g.deletedAt),
  }
}

export const mapHmIngredient = (h) => {
  if (!h) return h
  return {
    hm_ingredient_id: h.hm_ingredient_id ?? h.id,
    name: h.name,
    cost: h.cost,
    yield: h.yield ?? h.yieldAmount,
    notes: h.notes,
    unit: h.unit,
    image: h.image,
    is_stocked: h.is_stocked ?? h.isStocked,
    is_deleted: h.is_deleted ?? h.isDeleted,
    created_at: h.created_at ?? normalizeDate(h.createdAt),
    deleted_at: h.deleted_at ?? normalizeDate(h.deletedAt),
  }
}

export const mapRecipe = (r) => {
  if (!r) return r
  return {
    recipe_id: r.recipe_id ?? r.id,
    name: r.name,
    glass_id: r.glass_id ?? r.glassId,
    step_to_make: r.step_to_make ?? r.stepToMake,
    garnish: r.garnish,
    notes: r.notes,
    image: r.image,
    sale_price: r.sale_price ?? r.salePrice,
    is_mocktail: r.is_mocktail ?? r.isMocktail,
    is_deleted: r.is_deleted ?? r.isDeleted,
    created_at: r.created_at ?? normalizeDate(r.createdAt),
    deleted_at: r.deleted_at ?? normalizeDate(r.deletedAt),
  }
}

export const mapRecipeIngredient = (ri) => {
  if (!ri) return ri
  return {
    recipe_ingredient_id: ri.recipe_ingredient_id ?? ri.id,
    recipe_id: ri.recipe_id ?? ri.recipeId,
    ingredient_id: ri.ingredient_id ?? ri.ingredientId,
    quantity: ri.quantity,
    is_deleted: ri.is_deleted ?? ri.isDeleted,
    created_at: ri.created_at ?? normalizeDate(ri.createdAt),
    deleted_at: ri.deleted_at ?? normalizeDate(ri.deletedAt),
  }
}

export const mapRecipeHmIngredient = (rhi) => {
  if (!rhi) return rhi
  return {
    recipe_hm_ingredient_id: rhi.recipe_hm_ingredient_id ?? rhi.id,
    recipe_id: rhi.recipe_id ?? rhi.recipeId,
    hm_ingredient_id: rhi.hm_ingredient_id ?? rhi.hmIngredientId,
    quantity: rhi.quantity,
    is_deleted: rhi.is_deleted ?? rhi.isDeleted,
    created_at: rhi.created_at ?? normalizeDate(rhi.createdAt),
    deleted_at: rhi.deleted_at ?? normalizeDate(rhi.deletedAt),
  }
}

export const mapHmIngredientComponent = (c) => {
  if (!c) return c
  return {
    hm_ingredient_component_id: c.hm_ingredient_component_id ?? c.id,
    hm_ingredient_id: c.hm_ingredient_id ?? c.hmIngredientId,
    ingredient_id: c.ingredient_id ?? c.ingredientId,
    quantity: c.quantity,
    is_deleted: c.is_deleted ?? c.isDeleted,
    created_at: c.created_at ?? normalizeDate(c.createdAt),
    deleted_at: c.deleted_at ?? normalizeDate(c.deletedAt),
  }
}
