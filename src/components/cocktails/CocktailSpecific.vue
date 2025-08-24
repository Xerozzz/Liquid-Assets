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
        const rows = await getCocktailById(cocktailId) // returns rows from your query

        if (!rows || rows.length === 0) {
          this.error = new Error('Cocktail not found')
          return
        }

        // recipe-level info is identical on every row
        const r = rows[0]
        this.cocktail = {
          name: r.recipe_name,
          glass: r.glass_name,
          garnish: r.garnish,
          notes: r.notes,
          image: r.image,
          step_to_make: r.step_to_make,
        }

        // one flat list of items (you said mapping happens here, so keeping it)
        const items = rows.map((row) => ({
          kind: row.kind, // 'ingredient' | 'hm'
          id: row.item_id,
          name: row.item_name,
          quantity: row.item_quantity,
          unit: row.item_unit ?? null,
          cost: Number(row.item_quantity) * Number(row.item_cost || 0),
          stock: row.item_stock ? '✅' : '❌',
        }))

        this.ingredients = items
        this.totalCost = items.reduce((sum, x) => sum + (Number.isFinite(x.cost) ? x.cost : 0), 0)
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
  <div v-else class="bodysection">
    <button class="nav_button" @click="$router.push('/cocktail')">Back</button>
    <div class="grid grid-cols-3 gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ cocktail.name }}</h2>
        <img class="w-80 h-auto" :src="cocktail.image" alt="Cocktail Image" v-if="cocktail.image" />
        <h3>Glass:</h3>
        <p>{{ cocktail.glass }}</p>
        <h3>Garnish:</h3>
        <p>{{ cocktail.garnish }}</p>
        <h3>Total Cost:</h3>
        <p>${{ totalCost.toFixed(2) }}</p>
        <h3>Notes:</h3>
        <p>{{ cocktail.notes }}</p>
      </div>

      <div class="sectionbox">
        <h3>Steps to make:</h3>
        <p>{{ cocktail.step_to_make }}</p>
      </div>

      <div class="sectionbox">
        <h3>Ingredients:</h3>
        <p>Total Cost: ${{ totalCost.toFixed(2) }}</p>
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
            <tr v-for="item in ingredients" :key="`${item.kind}-${item.item_id}`">
              <td><span v-if="item.kind === 'hm'">(HM) </span>{{ item.name }}</td>
              <td>
                {{ item.quantity }} <span v-if="item.unit">{{ item.unit }}</span>
              </td>
              <td>${{ Number(item.cost).toFixed(2) }}</td>
              <td>{{ item.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
