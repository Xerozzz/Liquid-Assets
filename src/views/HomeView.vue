<script>
import { getRecipe } from '@/api/recipe.js'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      surprising: false,
      // Cached recipe list so repeated "Surprise Me" clicks don't refetch each time.
      recipesCache: null,
      // Quick-pick surprises by base spirit / mood — matched against a recipe's
      // name + ingredient list. Word boundaries avoid false hits (e.g. "gin" in
      // "ginger"). Patterns are strings (built into a RegExp at click time) to
      // avoid storing a RegExp in reactive data.
      surpriseFilters: [
        { label: 'Gin', pattern: '\\bgin\\b' },
        { label: 'Vodka', pattern: '\\bvodka\\b' },
        { label: 'Rum', pattern: '\\brum\\b' },
        { label: 'Whisky', pattern: '\\bwhisk(?:e)?y\\b|bourbon|scotch|\\brye\\b' },
        { label: 'Tequila', pattern: 'tequila|mezcal' },
        { label: '🍋 Citrusy', pattern: 'lemon|lime|grapefruit|yuzu|orange|mandarin' },
      ],
      pages: [
        { name: 'Cocktails', path: '/cocktail', icon: 'pi-sparkles' },
        { name: 'Mocktails', path: '/mocktail', icon: 'pi-star' },
        { name: 'Homemade Ingredients', path: '/hm', icon: 'pi-box' },
        { name: 'Ingredients', path: '/ingredient', icon: 'pi-list' },
        { name: 'Glassware', path: '/glassware', icon: 'pi-circle' },
        { name: 'Restock List', path: '/restock', icon: 'pi-shopping-cart' },
      ],
    }
  },
  methods: {
    async loadRecipes() {
      if (!this.recipesCache) this.recipesCache = await getRecipe() // cocktails + mocktails
      return this.recipesCache
    },
    // Pick a random drink, optionally filtered by a base-spirit/mood pattern, and
    // preferring in-stock recipes (missing_count === 0) so it suggests something
    // you can actually make right now.
    async surpriseMe(pattern = null) {
      if (this.surprising) return
      this.surprising = true
      try {
        let pool = await this.loadRecipes()
        if (pattern) {
          const re = new RegExp(pattern, 'i')
          pool = pool.filter((r) =>
            re.test(`${r.name} ${r.raw_ingredients_str || ''} ${r.hm_ingredients_str || ''}`),
          )
        }
        if (!pool.length) {
          this.notification.notify({
            message: 'Nothing matches that — try another pick!',
            severity: 'info',
          })
          return
        }
        // Weight toward in-stock: pick from makeable ones when any exist.
        const inStock = pool.filter((r) => r.missing_count === 0)
        const finalPool = inStock.length ? inStock : pool
        const pick = finalPool[Math.floor(Math.random() * finalPool.length)]
        const base = pick.is_mocktail ? '/mocktail' : '/cocktail'
        this.$router.push(`${base}/view/${pick.recipe_id}`)
      } catch {
        this.notification.notify({
          message: 'Could not pick a drink — try again.',
          severity: 'error',
        })
      } finally {
        this.surprising = false
      }
    },
  },
}
</script>

<template>
  <div class="min-h-[100vh]">
    <h1 class="font-bold text-3xl text-center pt-10 text-primary-900 tracking-tight">
      Liquid Assets
    </h1>
    <p class="text-center text-primary-700 mt-1">Your cocktail costing &amp; inventory companion</p>

    <div class="flex flex-col items-center gap-3 mt-6">
      <button
        class="sectionbox rounded-full text-lg font-semibold px-7 py-3 cursor-pointer flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
        :disabled="surprising"
        @click="surpriseMe()"
      >
        <span :class="{ 'inline-block animate-spin': surprising }">🎲</span>
        {{ surprising ? 'Pouring…' : 'Surprise Me' }}
      </button>

      <div class="flex flex-wrap justify-center items-center gap-2 px-6">
        <span class="text-sm text-primary-700">or by:</span>
        <button
          v-for="f in surpriseFilters"
          :key="f.label"
          class="text-sm px-3 py-1 rounded-full border border-primary-200 bg-white text-primary-800 hover:bg-primary-50 cursor-pointer transition-colors disabled:opacity-60"
          :disabled="surprising"
          @click="surpriseMe(f.pattern)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mx-6 sm:mx-[60px]">
      <button
        v-for="page in pages"
        class="sectionbox rounded-3xl text-xl cursor-pointer py-8 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        :key="page.name"
        @click="$router.push(page.path)"
      >
        <i :class="['pi', page.icon, 'text-primary-600']" style="font-size: 1.75rem"></i>
        {{ page.name }}
      </button>
    </div>
  </div>
</template>
