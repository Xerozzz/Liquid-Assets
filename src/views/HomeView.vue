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
    // Pick a random drink across everything (cocktails + mocktails) and go to it.
    async surpriseMe() {
      if (this.surprising) return
      this.surprising = true
      try {
        const recipes = await getRecipe() // no type filter -> cocktails + mocktails
        if (!recipes.length) {
          this.notification.notify({
            message: 'No recipes yet — create one first!',
            severity: 'info',
          })
          return
        }
        const pick = recipes[Math.floor(Math.random() * recipes.length)]
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
    <p class="text-center text-primary-700 mt-1">Your cocktail costing & inventory companion</p>

    <div class="flex justify-center mt-6">
      <button
        class="sectionbox rounded-full text-lg font-semibold px-7 py-3 cursor-pointer flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
        :disabled="surprising"
        @click="surpriseMe"
      >
        🎲 {{ surprising ? 'Pouring…' : 'Surprise Me' }}
      </button>
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
