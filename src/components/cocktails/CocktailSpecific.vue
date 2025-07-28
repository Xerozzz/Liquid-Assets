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
      totalCost: 0,
    }
  },
  methods: {
    async fetchCocktail() {
      try {
        const cocktailId = this.$route.params.id
        const data = await getCocktailById(cocktailId)
        this.cocktail = data[0]

        this.ingredients = data.map((row) => {
          const cost = row.quantity * row.ingredient_cost
          this.totalCost += cost

          return {
            id: row.ingredient_id,
            ingredient: row.ingredient_name,
            quantity: row.quantity,
            cost,
            stock: row.ingredient_stock ? '✅' : '❌',
          }
        })
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
      <h3>Glass:</h3>
      <p>{{ cocktail.glass_name }}</p>
      <h3>Garnish:</h3>
      <p>{{ cocktail.garnish }}</p>
      <h3>Total Cost:</h3>
      <p>${{ this.totalCost.toFixed(2) }}</p>
      <h3>Notes:</h3>
      <p>{{ cocktail.notes }}</p>
    </div>
    <div class="sectionbox">
      <h3>Steps to make:</h3>
      <p>{{ cocktail.step_to_make }}</p>
    </div>
    <div class="sectionbox">
      <h3>Ingredients:</h3>
      <p>Total Cost: ${{ this.totalCost.toFixed(2) }}</p>
      <table class="text-center">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Quantity</th>
            <th>Cost</th>
            <th>Stock Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingredient in ingredients" :key="ingredient.id">
            <td>{{ ingredient.ingredient }}</td>
            <td>{{ ingredient.quantity }}</td>
            <td>${{ ingredient.cost.toFixed(2) }}</td>
            <td>{{ ingredient.stock }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
