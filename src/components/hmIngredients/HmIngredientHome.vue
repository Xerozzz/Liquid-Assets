<script>
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'
import { getHmIngredient } from '@/api/hm_ingredients.js'
import { useImageStorage } from '@/composables/useImageStorage'

export default {
  name: 'HmIngredientHome',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    const { getImageUrl } = useImageStorage()
    return { notification, destroy, getImageUrl }
  },
  data() {
    return {
      loading: true,
      hmIngredients: [],
    }
  },
  methods: {
    async getData() {
      this.loading = true
      try {
        const rawData = await getHmIngredient()

        // --- RESOLVE IMAGES ---
        this.hmIngredients = await Promise.all(
          rawData.map(async (item) => {
            let finalUrl = null
            if (item.image) {
              if (item.image.startsWith('data:')) {
                finalUrl = item.image
              } else {
                finalUrl = await this.getImageUrl(item.image)
              }
            }
            return {
              ...item,
              displayImageUrl: finalUrl,
            }
          }),
        )
      } catch (error) {
        console.error(error)
        this.notification.notify({
          message: 'Failed to load homemade ingredients',
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    },
  },
  mounted() {
    this.getData()
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
      <button class="nav_button" @click="$router.push('/hm/create')">
        Create Homemade Ingredient
      </button>
    </div>

    <h1 class="title mt-0 mb-6">Homemade Ingredients</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="item in hmIngredients"
        :key="item.hm_ingredient_id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
        @click="$router.push(`/hm/view/${item.hm_ingredient_id}`)"
      >
        <div class="h-48 w-full bg-gray-50 relative border-b border-gray-100">
          <img
            v-if="item.displayImageUrl"
            :src="item.displayImageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
            <i class="pi pi-image" style="font-size: 3rem"></i>
          </div>
        </div>

        <div class="p-4 flex flex-col justify-between flex-grow">
          <div class="text-center mb-4">
            <h3 class="font-bold text-xl text-gray-800">{{ item.name }}</h3>
            <span class="text-xs text-gray-500">Yield: {{ item.yield }} {{ item.unit }}</span>
          </div>

          <hr class="border-gray-300 mb-4" />

          <div class="flex justify-between items-center text-sm">
            <div>
              <p class="font-bold text-gray-700">
                {{ formatCurrency(item.cost) }}
              </p>
            </div>

            <div>
              <span
                v-if="item.is_stocked"
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
    </div>

    <div v-if="!loading && hmIngredients.length === 0" class="text-center py-20 text-gray-400">
      <p>No homemade ingredients found. Click "Create" to start cooking!</p>
    </div>
  </div>
</template>
