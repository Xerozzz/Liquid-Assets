<script>
export default {
  data() {
    return {
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
}
</script>

<template>
  <div class="min-h-[100vh]">
    <h1 class="font-bold text-3xl text-center pt-10 text-primary-900 tracking-tight">
      Liquid Assets
    </h1>
    <p class="text-center text-primary-700 mt-1">Your cocktail costing & inventory companion</p>
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
