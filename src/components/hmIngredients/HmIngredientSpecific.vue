<script>
import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'

import { getHmIngredientById, deleteHmIngredient } from '@/api/hm_ingredients'
import { getHmIngredientComponentByHmIngredientId } from '@/api/hm_ingredient_components'

import DeleteDialog from '../DeleteDialog.vue'
import RecipePlaceholder from '@/components/RecipePlaceholder.vue'

export default {
  name: 'HmIngredientSpecific',
  components: { DeleteDialog, RecipePlaceholder },
  setup() {
    const notification = useNotificationStore()
    const { getImageUrl, deleteImage } = useImageStorage()
    return { notification, getImageUrl, deleteImage }
  },
  data() {
    return {
      loading: true,
      hmIngredient: null,
      displayImageUrl: null,
      error: null,
      ingredients: [],
      totalCost: 0,
    }
  },
  methods: {
    async getHmIngredient() {
      try {
        const id = this.$route.params.id

        const mainData = await getHmIngredientById(id)

        if (!mainData) {
          this.error = new Error('Hm ingredient not found')
          return
        }

        this.hmIngredient = {
          id: mainData.hm_ingredient_id || id,
          name: mainData.name,
          cost: Number(mainData.cost),
          image: mainData.image,
          unit: mainData.unit,
          yield: mainData.yield,
          notes: mainData.notes,
          is_stocked: mainData.is_stocked === 1 || mainData.is_stocked === true,
        }

        if (this.hmIngredient.image) {
          this.displayImageUrl = await this.getImageUrl(this.hmIngredient.image)
        }

        // Fetch Components List
        const componentsData = await getHmIngredientComponentByHmIngredientId(id)

        if (Array.isArray(componentsData)) {
          this.ingredients = componentsData.map((row) => ({
            id: row.ingredient_id || row.component_id,
            name: row.ingredient_name || row.name,
            quantity: row.quantity,
            unit: row.unit,
            cost: Number(row.cost),
            is_stocked: row.is_stocked || false,
          }))

          // Calculate Total Cost of the batch components
          this.totalCost = this.ingredients.reduce(
            (sum, item) => sum + item.cost * item.quantity,
            0,
          )
        }
      } catch (error) {
        console.error(error)
        this.error = error
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Homemade Ingredient',
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
        await deleteHmIngredient(this.$route.params.id)
        if (this.hmIngredient?.image) {
          await this.deleteImage(this.hmIngredient.image)
        }
        this.notification.notify({
          message: `Homemade ingredient deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace('/hm')
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
    this.getHmIngredient()
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
    <button class="nav_button" @click="$router.push('/hm')">Back</button>
    <button class="nav_button" @click="$router.push(`/hm/edit/${this.$route.params.id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ hmIngredient.name }}</h2>

        <img
          v-if="displayImageUrl"
          class="w-80 h-auto rounded shadow-sm mb-4"
          :src="displayImageUrl"
          alt="Item Image"
        />
        <div v-else class="w-80 h-60 rounded shadow-sm mb-4 overflow-hidden">
          <RecipePlaceholder :name="hmIngredient.name" />
        </div>

        <h3>Yield:</h3>
        <p>{{ hmIngredient.yield }} {{ hmIngredient.unit }}</p>

        <h3>Unit Cost:</h3>
        <p class="text-3xl font-bold text-primary-700">${{ hmIngredient.cost.toFixed(2) }}</p>

        <h3>Status:</h3>
        <div class="mt-1">
          <span
            v-if="hmIngredient.is_stocked"
            class="px-2 py-1 rounded-md bg-green-100 text-green-700 font-bold text-xs"
          >
            In Stock
          </span>
          <span v-else class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs">
            Out
          </span>
        </div>
      </div>

      <div class="sectionbox">
        <h3>Notes:</h3>
        <p class="whitespace-pre-line text-gray-800">
          {{ hmIngredient.notes || 'No notes provided.' }}
        </p>
      </div>

      <div class="sectionbox">
        <h3>Components:</h3>
        <p class="text-sm text-gray-500 mb-2">Total Batch Cost: ${{ totalCost.toFixed(2) }}</p>
        <div class="overflow-x-auto">
          <table class="text-center w-full">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in ingredients" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }} {{ item.unit }}</td>
                <td>${{ Number(item.cost).toFixed(2) }}</td>
                <td>
                  <span
                    v-if="item.is_stocked"
                    class="px-2 py-1 rounded-md bg-green-100 text-green-700 font-bold text-xs"
                  >
                    In
                  </span>
                  <span
                    v-else
                    class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs"
                  >
                    Out
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
