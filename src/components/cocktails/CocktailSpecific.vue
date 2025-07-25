<script>
import { getCocktailById } from '@/api/cocktail.js'

export default {
  name: 'CocktailSpecific',
  data() {
    return {
      loading: true,
      cocktail: null,
      error: null,
      ingredients: [],
    }
  },
  methods: {
    async fetchCocktail() {
      try {
        const cocktailId = this.$route.params.id
        const data = await getCocktailById(cocktailId)
        this.cocktail = data[0]
        this.ingredients = data.map((row) => ({
          id: row.ingredient_id,
          ingredient: row.ingredient_name,
          quantity: row.quantity,
          cost: row.quantity * row.ingredient_cost,
          stock: row.ingredient_stock ? 'In Stock' : 'Out of Stock',
        }))
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.fetchCocktail()
  },
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else>
    <h2>Name: {{ cocktail.recipe_name }}</h2>
    <p>Glass: {{ cocktail.glass_name }}</p>
    <p>Garnish: {{ cocktail.garnish }}</p>
    <p>Notes: {{ cocktail.notes }}</p>
    <img :src="cocktail.image" alt="Cocktail Image" />
    <p>Ingredients:</p>
    <p v-for="ingredient in ingredients" :key="ingredient.id">
      {{ ingredient.ingredient }} - {{ ingredient.quantity }}
    </p>
  </div>
</template>
