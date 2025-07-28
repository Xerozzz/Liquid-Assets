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
  <div v-else class="bodysection grid grid-cols-3 gap-11">
    <div class="sectionbox">
      <h2 class="title">{{ cocktail.recipe_name }}</h2>
      <img
        class="w-80 h-auto"
        v-bind:src="cocktail.image"
        alt="Cocktail Image"
        v-if="cocktail.image"
      />
      <p>Glass: {{ cocktail.glass_name }}</p>
      <p>Garnish: {{ cocktail.garnish }}</p>
      <p>Notes: {{ cocktail.notes }}</p>
    </div>
    <div class="sectionbox">
      <p>Steps to make:</p>
      <p>{{ cocktail.step_to_make }}</p>
    </div>
    <div class="sectionbox">
      <p>Ingredients:</p>
      <p v-for="ingredient in ingredients" :key="ingredient.id">
        {{ ingredient.ingredient }} - {{ ingredient.quantity }}
      </p>
    </div>
  </div>
</template>
