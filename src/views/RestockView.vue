<script>
import { getIngredients, updateIngredient } from '@/api/ingredients.js'
import { getHmIngredient, updateHmIngredient } from '@/api/hm_ingredients.js'
import { getCocktail } from '@/api/cocktail.js'
import { useNotificationStore } from '@/stores/notification.store'

const splitNames = (str) => (str ? str.split(',').map((s) => s.trim().toLowerCase()) : [])

export default {
  name: 'RestockView',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      loading: true,
      ingredients: [],
      hmIngredients: [],
      cocktails: [],
      togglingId: null,
    }
  },
  computed: {
    outOfStockItems() {
      const items = [
        ...this.ingredients
          .filter((i) => !i.is_stocked)
          .map((i) => ({
            kind: 'ingredient',
            id: i.ingredient_id,
            name: i.name,
            unit: i.unit,
            cost: i.cost,
            raw: i,
          })),
        ...this.hmIngredients
          .filter((h) => !h.is_stocked)
          .map((h) => ({
            kind: 'hm',
            id: h.hm_ingredient_id,
            name: h.name,
            unit: h.unit,
            cost: h.cost,
            raw: h,
          })),
      ]

      const withImpact = items.map((item) => {
        const field = item.kind === 'hm' ? 'hm_ingredients_str' : 'raw_ingredients_str'
        const target = item.name.trim().toLowerCase()
        const affected = this.cocktails.filter((c) => splitNames(c[field]).includes(target))
        return { ...item, affected }
      })

      return withImpact.sort((a, b) => b.affected.length - a.affected.length)
    },
    affectedCocktailCount() {
      const ids = new Set()
      this.outOfStockItems.forEach((item) => item.affected.forEach((c) => ids.add(c.recipe_id)))
      return ids.size
    },
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [ingredients, hmIngredients, cocktails] = await Promise.all([
          getIngredients(),
          getHmIngredient(),
          getCocktail(),
        ])
        this.ingredients = ingredients
        this.hmIngredients = hmIngredients
        this.cocktails = cocktails
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to load restock data', severity: 'error' })
      } finally {
        this.loading = false
      }
    },
    async restockItem(item) {
      this.togglingId = `${item.kind}-${item.id}`
      try {
        if (item.kind === 'ingredient') {
          const updated = await updateIngredient(
            item.raw.name,
            item.raw.unit,
            item.raw.cost,
            true,
            item.raw.ingredient_id,
          )
          item.raw.is_stocked = updated.is_stocked
        } else {
          const updated = await updateHmIngredient(
            item.raw.name,
            item.raw.cost,
            item.raw.notes,
            item.raw.image,
            item.raw.unit,
            item.raw.yield,
            true,
            item.raw.hm_ingredient_id,
          )
          item.raw.is_stocked = updated.is_stocked
        }
        this.notification.notify({
          message: `${item.name} marked as In Stock`,
          severity: 'success',
        })
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to update stock status', severity: 'error' })
      } finally {
        this.togglingId = null
      }
    },
  },
  mounted() {
    this.loadData()
  },
}
</script>

<template>
  <div class="bodysection">
    <button class="nav_button" @click="$router.push('/')">Back</button>

    <h1 class="title mt-0 mb-2">Restock List</h1>
    <p class="text-gray-500 mb-6">
      Ingredients and homemade components currently marked out of stock, ranked by how many
      cocktails they're blocking.
    </p>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="sectionbox text-center">
          <p class="text-3xl font-bold text-primary-700">{{ outOfStockItems.length }}</p>
          <p class="text-sm text-gray-500 mt-1">Items Out of Stock</p>
        </div>
        <div class="sectionbox text-center">
          <p class="text-3xl font-bold text-primary-700">{{ affectedCocktailCount }}</p>
          <p class="text-sm text-gray-500 mt-1">Cocktails Affected</p>
        </div>
        <div class="sectionbox text-center">
          <p class="text-3xl font-bold text-primary-700">
            {{ ingredients.length + hmIngredients.length }}
          </p>
          <p class="text-sm text-gray-500 mt-1">Total Items Tracked</p>
        </div>
      </div>

      <div v-if="outOfStockItems.length === 0" class="text-center py-20 text-gray-400">
        <i class="pi pi-check-circle mb-2 block" style="font-size: 2rem"></i>
        Everything is in stock. Nothing to restock right now.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="item in outOfStockItems"
          :key="`${item.kind}-${item.id}`"
          class="sectionbox flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-lg text-gray-800">{{ item.name }}</h3>
              <span
                v-if="item.kind === 'hm'"
                class="px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold"
              >
                Homemade
              </span>
              <span
                v-if="item.affected.length > 0"
                class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold"
              >
                Blocks {{ item.affected.length }} cocktail{{
                  item.affected.length === 1 ? '' : 's'
                }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              ${{ Number(item.cost).toFixed(2) }} / {{ item.unit }}
            </p>

            <div v-if="item.affected.length > 0" class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="c in item.affected"
                :key="c.recipe_id"
                type="button"
                class="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition-colors"
                @click="$router.push(`/cocktail/view/${c.recipe_id}`)"
              >
                {{ c.name }}
              </button>
            </div>
          </div>

          <Button
            label="Mark In Stock"
            icon="pi pi-check"
            :loading="togglingId === `${item.kind}-${item.id}`"
            @click="restockItem(item)"
            class="shrink-0"
          />
        </div>
      </div>
    </template>
  </div>
</template>
