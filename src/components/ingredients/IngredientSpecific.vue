<script>
import { deleteIngredient, getIngredientById } from '@/api/ingredients.js'
import { useNotificationStore } from '@/stores/notification.store'
import DeleteDialog from '../DeleteDialog.vue'

export default {
  name: 'IngredientSpecific',
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      loading: true,
      ingredient: null,
      error: null,
    }
  },
  methods: {
    async fetchIngredient() {
      try {
        const id = this.$route.params.id
        const result = await getIngredientById(id)

        const ingredient = Array.isArray(result) ? result[0] : result

        if (!ingredient) {
          this.error = new Error('Ingredient not found')
          return
        }
        this.ingredient = ingredient
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Ingredient',
        message:
          'This action cannot be undone. Check if this ingredient is used in any recipes first!',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Delete',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        rejectClass: 'p-button-text',
        accept: () => this.deleteItem(),
      })
    },
    async deleteItem() {
      try {
        await deleteIngredient(this.ingredient.ingredient_id)
        this.notification.notify({
          message: 'Ingredient deleted successfully',
          severity: 'success',
        })
        this.$router.replace('/ingredient')
      } catch (error) {
        this.notification.notify({
          message: 'Cannot delete: Ingredient is likely used in a recipe.',
          severity: 'error',
        })
      }
    },
  },
  mounted() {
    this.fetchIngredient()
  },
}
</script>

<template>
  <DeleteDialog />

  <div v-if="loading" class="flex justify-center p-10"><ProgressSpinner /></div>
  <div v-else-if="error" class="text-center p-10 text-red-500">{{ error.message }}</div>

  <div v-else class="bodysection">
    <div class="flex gap-2 mb-4">
      <button class="nav_button" @click="$router.push('/ingredient')">Back</button>
      <button
        class="nav_button"
        @click="$router.push(`/ingredient/edit/${ingredient.ingredient_id}`)"
      >
        Edit
      </button>
      <button class="nav_button" @click="confirmDelete">Delete</button>
    </div>

    <div class="border border-black rounded-md p-6 w-full md:w-1/2">
      <h1 class="text-3xl font-bold mb-1">{{ ingredient.name }}</h1>
      <p class="text-gray-600 mb-8">Ingredient ID: {{ ingredient.ingredient_id }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p class="font-bold text-lg">Cost/{{ ingredient.unit }}</p>
          <p class="text-lg mb-4">${{ ingredient.cost.toFixed(2) }}</p>

          <p class="font-bold text-lg">Unit Type</p>
          <p class="text-lg capitalize">{{ ingredient.unit }}</p>
        </div>

        <div>
          <p class="font-bold text-lg">Stock Status</p>
          <div class="mt-1">
            <span v-if="ingredient.is_stocked" class="font-bold text-green-700">
              <i class="pi pi-check"></i> In Stock
            </span>
            <span v-else class="font-bold text-red-700">
              <i class="pi pi-times"></i> Out of Stock
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
