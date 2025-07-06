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
  <h1>Cocktail App</h1>
  <div>
    <button v-for="page in pages" :key="page.name" @click="$router.push(page.path)">
      {{ page.name }}
    </button>
  </div>
</template>

<style scoped>
button {
  margin: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: black;
  color: white;
}
</style>
