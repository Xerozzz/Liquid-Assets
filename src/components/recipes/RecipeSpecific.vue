<script>
import { deleteRecipe, getRecipeById } from '@/api/recipe.js'
import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'
import DeleteDialog from '../DeleteDialog.vue'
import { deleteRecipeHmIngredientByRecipeId } from '@/api/recipe_hm_ingredient'
import { deleteRecipeIngredientByRecipeId } from '@/api/recipe_ingredient'
import { getIngredientById, updateIngredient } from '@/api/ingredients'
import { getHmIngredientById, updateHmIngredient } from '@/api/hm_ingredients'
import RecipePlaceholder from '@/components/RecipePlaceholder.vue'

export default {
  name: 'RecipeSpecific',
  components: { DeleteDialog, RecipePlaceholder },
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
      togglingId: null,
    }
  },
  computed: {
    isMocktail() {
      return this.$route.meta.isMocktail === true
    },
    basePath() {
      return this.isMocktail ? '/mocktail' : '/cocktail'
    },
    itemLabel() {
      return this.isMocktail ? 'Mocktail' : 'Cocktail'
    },
    margin() {
      if (this.cocktail?.salePrice == null) return null
      return Number(this.cocktail.salePrice) - this.totalCost
    },
    marginPercent() {
      if (this.margin == null || !this.cocktail.salePrice) return null
      return (this.margin / Number(this.cocktail.salePrice)) * 100
    },
  },
  methods: {
    async toggleIngredientStock(item) {
      this.togglingId = `${item.kind}-${item.id}`
      try {
        if (item.kind === 'ingredient') {
          const ing = await getIngredientById(item.id)
          await updateIngredient(ing.name, ing.unit, ing.cost, !ing.is_stocked, ing.ingredient_id)
        } else {
          const hm = await getHmIngredientById(item.id)
          await updateHmIngredient(
            hm.name,
            hm.cost,
            hm.notes,
            hm.image,
            hm.unit,
            hm.yield,
            !hm.is_stocked,
            hm.hm_ingredient_id,
          )
        }
        item.stock = !item.stock
        this.notification.notify({
          message: `${item.name} marked as ${item.stock ? 'In Stock' : 'Out of Stock'}`,
          severity: 'success',
        })
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to update stock status', severity: 'error' })
      } finally {
        this.togglingId = null
      }
    },
    async fetchCocktail() {
      try {
        const cocktailId = this.$route.params.id
        const rows = await getRecipeById(cocktailId)

        if (!rows || rows.length === 0) {
          throw new Error(`${this.itemLabel} not found`)
        }

        const r = rows[0]
        this.cocktail = {
          name: r.recipe_name,
          glass: r.glass_name,
          glassCapacity: r.glass_volume,
          garnish: r.garnish,
          notes: r.notes,
          image: r.image,
          salePrice: r.sale_price,
          // Strip any leading "1. "/"1) " the step text already carries — steps are rendered in
          // an auto-numbered <ol>, so a number baked into the text itself would double up.
          step_to_make: r.step_to_make
            ? r.step_to_make
                .split('\n')
                .map((step) => step.replace(/^\s*\d+[.)]\s*/, '').trim())
                .filter((step) => step !== '')
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
        header: `Delete ${this.itemLabel}`,
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
        await deleteRecipe(this.$route.params.id)
        await deleteRecipeHmIngredientByRecipeId(this.$route.params.id)
        await deleteRecipeIngredientByRecipeId(this.$route.params.id)
        if (this.cocktail?.image) {
          await this.deleteImage(this.cocktail.image)
        }
        this.notification.notify({
          message: `${this.itemLabel} deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace(this.basePath)
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
  <div v-if="loading" class="flex justify-center items-center h-64">
    <ProgressSpinner />
  </div>
  <div v-else-if="error" class="text-center p-10 text-primary-700">
    <i class="pi pi-exclamation-circle mb-2 block" style="font-size: 2rem"></i>
    {{ error.message }}
  </div>
  <div v-else class="bodysection">
    <button class="nav_button" @click="$router.push(basePath)">Back</button>
    <button class="nav_button" @click="$router.push(`${basePath}/edit/${this.$route.params.id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ cocktail.name }}</h2>

        <img
          v-if="displayImageUrl"
          :src="displayImageUrl"
          alt="Cocktail Image"
          class="w-80 h-auto rounded shadow-sm mb-4"
        />
        <div v-else class="w-80 h-60 rounded shadow-sm mb-4 overflow-hidden">
          <RecipePlaceholder :name="cocktail.name" />
        </div>

        <h3>Glass:</h3>
        <p>
          {{ cocktail.glass }}
          <span v-if="cocktail.glassCapacity" class="text-gray-500">
            ({{ cocktail.glassCapacity }} ml capacity)
          </span>
        </p>
        <h3>Garnish:</h3>
        <p>{{ cocktail.garnish }}</p>

        <div class="grid grid-cols-2 gap-4 mt-2">
          <div>
            <h3>Cost:</h3>
            <p class="text-3xl font-bold text-primary-700">${{ totalCost.toFixed(2) }}</p>
          </div>
          <div>
            <h3>Sale Price:</h3>
            <p v-if="cocktail.salePrice != null" class="text-3xl font-bold text-primary-700">
              ${{ Number(cocktail.salePrice).toFixed(2) }}
            </p>
            <p v-else class="text-gray-400 italic">Not set</p>
          </div>
        </div>

        <div v-if="margin != null" class="mt-2">
          <h3>Margin:</h3>
          <p :class="['text-xl font-bold', margin >= 0 ? 'text-green-600' : 'text-red-600']">
            ${{ margin.toFixed(2) }}
            <span v-if="marginPercent != null" class="text-sm font-normal text-gray-500">
              ({{ marginPercent.toFixed(0) }}%)
            </span>
          </p>
        </div>

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
        <div class="overflow-x-auto">
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
                  <div v-else class="flex items-center justify-center gap-2">
                    <span class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs">
                      Out
                    </span>
                    <button
                      type="button"
                      :disabled="togglingId === `${item.kind}-${item.id}`"
                      class="text-xs font-semibold text-primary-700 hover:text-primary-900 underline disabled:opacity-50"
                      @click="toggleIngredientStock(item)"
                    >
                      Mark In Stock
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
