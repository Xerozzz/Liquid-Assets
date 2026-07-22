<script>
import { deleteCocktail, getCocktailById } from '@/api/cocktail.js'
import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'
import DeleteDialog from '../DeleteDialog.vue'
import { deleteRecipeHmIngredientByRecipeId } from '@/api/recipe_hm_ingredient'
import { deleteRecipeIngredientByRecipeId } from '@/api/recipe_ingredient'

export default {
  name: 'CocktailSpecific',
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    const { getImageUrl, deleteImage } = useImageStorage()
    return { notification, getImageUrl, deleteImage }
  },
  data() {
    return {
      loading: true,
      cocktail: null,
      displayImageUrl: null,
      error: null,
      ingredients: [],
      totalCost: 0,
      actualVolume: 0,
    }
  },
  methods: {
    async fetchCocktail() {
      try {
        const cocktailId = this.$route.params.id
        const rows = await getCocktailById(cocktailId)

        if (!rows || rows.length === 0) {
          throw new Error('Cocktail not found')
        }

        const r = rows[0]
        this.cocktail = {
          name: r.recipe_name,
          glass: r.glass_name,
          glassCapacity: r.glass_volume,
          garnish: r.garnish,
          notes: r.notes,
          image: r.image,
          step_to_make: r.step_to_make
            ? r.step_to_make.split('\n').filter((step) => step.trim() !== '')
            : [],
        }

        if (this.cocktail.image) {
          this.displayImageUrl = await this.getImageUrl(this.cocktail.image)
        }

        const items = rows.map((row) => ({
          kind: row.kind,
          id: row.item_id,
          name: row.item_name,
          quantity: row.item_quantity,
          unit: row.item_unit ?? null,
          cost: Number(row.item_quantity) * Number(row.item_cost || 0),
          stock: !!row.item_stock,
        }))

        this.ingredients = items
        this.totalCost = items.reduce((sum, x) => sum + (Number.isFinite(x.cost) ? x.cost : 0), 0)
        this.actualVolume = items
          .filter((x) => (x.unit || '').toLowerCase() === 'ml')
          .reduce((sum, x) => sum + (Number(x.quantity) || 0), 0)
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
        if (this.cocktail?.image) {
          await this.deleteImage(this.cocktail.image)
        }
        this.notification.notify({
          message: `Cocktail deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace('/cocktail')
      } catch (error) {
        console.log(error)
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    cancelAction() {},
  },
  mounted() {
    this.fetchCocktail()
  },
}
</script>

<template>
  <DeleteDialog />
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else class="bodysection">
    <button class="nav_button" @click="$router.push('/cocktail')">Back</button>
    <button class="nav_button" @click="$router.push(`/cocktail/edit/${this.$route.params.id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>

    <div class="grid grid-cols-3 gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ cocktail.name }}</h2>

        <img
          v-if="displayImageUrl"
          :src="displayImageUrl"
          alt="Cocktail Image"
          class="w-80 h-auto rounded shadow-sm mb-4"
        />

        <h3>Glass:</h3>
        <p>
          {{ cocktail.glass }}
          <span v-if="cocktail.glassCapacity" class="text-gray-500">
            ({{ cocktail.glassCapacity }} ml capacity)
          </span>
        </p>
        <h3>Garnish:</h3>
        <p>{{ cocktail.garnish }}</p>
        <h3>Total Cost:</h3>
        <p>${{ totalCost.toFixed(2) }}</p>
        <h3>Notes:</h3>
        <p>{{ cocktail.notes }}</p>
      </div>

      <div class="sectionbox">
        <h3>Steps to make:</h3>
        <ol class="list-decimal list-inside space-y-2 mt-2 text-gray-800">
          <li v-for="(step, index) in cocktail.step_to_make" :key="index">
            {{ step }}
          </li>
        </ol>
        <p v-if="cocktail.step_to_make.length === 0" class="text-gray-500 italic">
          No instructions provided.
        </p>
      </div>

      <div class="sectionbox">
        <h3>Ingredients:</h3>
        <p>
          Total Cost: <b>${{ totalCost.toFixed(2) }}</b>
        </p>
        <p>
          Actual Volume: <b>{{ actualVolume }} ml</b>
        </p>
        <table class="text-center w-full">
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

              <td>
                <span
                  v-if="item.stock"
                  class="px-2 py-1 rounded-md bg-green-100 text-green-700 font-bold text-xs"
                >
                  In Stock
                </span>
                <span v-else class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs">
                  Out
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
