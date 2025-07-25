<script>
import CocktailCreate from '@/components/cocktail/CocktailCreate.vue';
export default {
  data() {
    return {
      pages: [
        { name: 'Cocktails', path: '/cocktail'},
        { name: 'Homemade Ingredients', path: '/hm' },
        { name: 'Ingredients', path: '/ingredient' },
        { name: 'Glassware', path: '/glassware' },
      ],
    }
  },
}
</script>

<template>
  <div class="app">
    <h1>Cocktail App</h1>
    <div class="grid">
      <button v-for="page in pages" :key="page.name" @click="$router.push(page.path)">
        {{ page.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fce5e5;
  margin: 0;
  padding: 0;
}

h1 {
  text-align: center;
  margin: 10px 0;
  flex: 0 0 auto;
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
}

button {
  width: 100%;
  height: 100%;
  font-size: 18px;
  background-color: #d88c8c;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #c67676;
}
</style>
