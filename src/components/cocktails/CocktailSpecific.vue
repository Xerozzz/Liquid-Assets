<script>
import { deleteCocktail, getCocktailById } from '@/api/cocktail.js'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import { Button } from 'primevue'

import DeleteDialog from '../DeleteDialog.vue'
import { deleteRecipeHmIngredientByRecipeId } from '@/api/recipe_hm_ingredient'
import { deleteRecipeIngredientByRecipeId } from '@/api/recipe_ingredient'

export default {
  name: 'CocktailSpecific',
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
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
        if (data.length == 0) {
          this.notification.notify({
            message: `Cocktail does not exist`,
            summary: 'No Cocktail found',
            severity: 'error',
          })
          this.$router.replace('/cocktail')
        } else {
          this.ingredients = data.map((row) => {
            const cost = row.quantity * row.ingredient_cost
            this.totalCost += cost

            return {
              id: row.ingredient_id,
              ingredient: row.ingredient_name,
              quantity: row.quantity,
              cost,
              unit: row.ingredient_unit,
              stock: row.ingredient_stock ? '✅' : '❌',
            }
          })
        }
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Cocktail',
        message: 'This action cannot be undone. Do you want to proceed?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Delete',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        rejectClass: 'p-button-text',
        accept: () => {
          this.deleteItem()
        },
        reject: () => {
          this.cancelAction()
        },
      })
    },
    async deleteItem() {
      try {
        await deleteCocktail(this.$route.params.id)
        await deleteRecipeHmIngredientByRecipeId(this.$route.params.id)
        await deleteRecipeIngredientByRecipeId(this.$route.params.id)
        this.notification.notify({
          message: `Cocktail deleted successfully`,
          summary: 'Delete Sucess',
          severity: 'success',
        })
        this.$router.replace('/cocktail')
      } catch (error) {
        console.log(error)
      }
    },
    cancelAction() {},
  },
  mounted() {
    this.fetchCocktail()
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <DeleteDialog />
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else class="bodysection">
    <Button label="Delete Item" icon="pi pi-trash" @click="confirmDelete" />

    <button class="nav_button" @click="$router.push('/cocktail')">Back</button>
    <div class="grid grid-cols-3 gap-11">
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
              <td>{{ ingredient.quantity }} {{ ingredient.unit }}</td>
              <td>${{ ingredient.cost.toFixed(2) }}</td>
              <td>{{ ingredient.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
