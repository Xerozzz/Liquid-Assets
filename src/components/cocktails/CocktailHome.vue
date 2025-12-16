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
    <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <h1 class="title m-0">Cocktail Menu</h1>
      <div class="space-x-2">
        <Button label="Back" severity="secondary" @click="$router.push('/')" />
        <Button
          label="Create Cocktail"
          icon="pi pi-plus"
          @click="$router.push('/cocktail/create')"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="cocktail in queryResult"
        :key="cocktail.recipe_id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
        @click="$router.push(`/cocktail/view/${cocktail.recipe_id}`)"
      >
        <div class="h-48 bg-gray-100 relative">
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

        <div class="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-lg text-gray-800 mb-1">{{ cocktail.name }}</h3>
            <p v-if="cocktail.glass_name" class="text-sm text-gray-500 flex items-center gap-1">
              <i class="pi pi-box text-xs"></i> {{ cocktail.glass_name }}
            </p>
          </div>

          <div class="mt-4 flex justify-end">
            <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              View Recipe
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && queryResult.length === 0"
      class="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
    >
      <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-500 text-lg">No cocktails found.</p>
      <Button label="Create your first cocktail" link @click="$router.push('/cocktail/create')" />
    </div>
  </div>
</template>
