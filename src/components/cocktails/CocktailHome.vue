<script>
import { getCocktail } from '@/api/cocktail.js'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'CocktailHome',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      loading: true,
      queryResult: [],
      queryError: null,
    }
  },
  methods: {
    async retrieveCocktails() {
      try {
        this.loading = true
        this.queryResult = await getCocktail()
      } catch (error) {
        this.queryError = error
        this.notification.notify({
          message: 'Failed to load cocktails',
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.retrieveCocktails()
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
      <button class="nav_button" @click="$router.push('/cocktail/create')">Create Cocktail</button>
    </div>

    <h1 class="title mt-0 mb-6">Cocktail Menu</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="cocktail in queryResult"
        :key="cocktail.recipe_id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
        @click="$router.push(`/cocktail/view/${cocktail.recipe_id}`)"
      >
        <div class="h-48 w-full bg-gray-50 relative border-b border-gray-100">
          <img
            v-if="cocktail.image"
            :src="cocktail.image"
            :alt="cocktail.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
            <i class="pi pi-image" style="font-size: 3rem"></i>
          </div>
        </div>

        <div class="p-4 text-center">
          <h3 class="font-bold text-xl text-gray-800">{{ cocktail.name }}</h3>

          <div class="mt-2">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >View Recipe</span
            >
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && queryResult.length === 0" class="text-center py-20 text-gray-400">
      <p>No cocktails found. Click "Create Cocktail" to start mixing!</p>
    </div>
  </div>
</template>
