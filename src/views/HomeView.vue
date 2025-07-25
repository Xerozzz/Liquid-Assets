<script>
export default {
  data() {
    return {
      pages: [
        { name: 'Cocktails', path: '/cocktail' },
        { name: 'Homemade Ingredients', path: '/hm' },
        { name: 'Ingredients', path: '/ingredient' },
        { name: 'Glassware', path: '/glassware' },
      ],
    }
  },
}
</script>

<template>
  <div class="min-h-[100vh]">
    <h1 class="font-bold text-2xl text-center">Cocktail App</h1>
    <div class="grid grid-cols-2 items-stretch min-h-[90vh] my-5 mx-15">
      <button
        v-for="page in pages"
        class="rounded-3xl text-xl cursor-pointer my-5 mx-5"
        :key="page.name"
        @click="$router.push(page.path)"
      >
        {{ page.name }}
      </button>
    </div>
  </div>
</template>
