<script>
import { getIngredients } from '@/api/ingredients.js'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'IngredientHome',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      loading: true,
      queryResult: [],
    }
  },
  methods: {
    async retrieveIngredients() {
      try {
        this.loading = true
        this.queryResult = await getIngredients()
      } catch (error) {
        this.notification.notify({
          message: 'Failed to load ingredients',
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.retrieveIngredients()
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <div class="bodysection">
    <div class="flex gap-2 mb-2">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push('/ingredient/create')">Add Ingredient</button>
    </div>

    <h1 class="title mt-0 mb-6">Pantry & Ingredients</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="ing in queryResult"
        :key="ing.ingredient_id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
        @click="$router.push(`/ingredient/view/${ing.ingredient_id}`)"
      >
        <div class="text-center mb-4">
          <h3 class="font-bold text-xl text-gray-800">{{ ing.name }}</h3>
        </div>

        <hr class="border-gray-300 mb-4" />

        <div class="flex justify-between items-center text-sm">
          <div>
            <p class="font-bold text-gray-700">
              ${{ ing.cost.toFixed(2) }}
              <span class="font-normal text-gray-500">/ {{ ing.unit }}</span>
            </p>
          </div>

          <div>
            <span
              v-if="ing.is_stocked"
              class="px-2 py-1 rounded-md bg-green-100 text-green-700 font-bold text-xs"
            >
              In Stock
            </span>
            <span v-else class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs">
              Out
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && queryResult.length === 0" class="text-center py-20 text-gray-400">
      <p>No ingredients found. Click "Add Ingredient" to start.</p>
    </div>
  </div>
</template>
