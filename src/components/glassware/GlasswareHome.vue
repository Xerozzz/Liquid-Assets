<script>
import { getGlassware } from '@/api/glassware'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'GlasswareHome',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      loading: true,
      glassware: [],
    }
  },
  methods: {
    async loadData() {
      try {
        this.loading = true
        this.glassware = await getGlassware()
      } catch (error) {
        this.notification.notify({
          message: 'Failed to load glassware',
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.loadData()
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <div class="bodysection">
    <button class="nav_button" @click="$router.push('/')">Back</button>
    <button class="nav_button" @click="$router.push('/glassware/create')">Add Glass</button>

    <h1 class="title">Glassware Inventory</h1>

    <div v-if="loading" class="flex justify-center mt-10">
      <ProgressSpinner />
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 justify-center gap-8 mt-6">
      <div
        v-for="glass in glassware"
        :key="glass.glass_id"
        class="border border-gray-300 rounded-md text-center p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white flex flex-col justify-center items-center h-32"
        @click="$router.push(`/glassware/view/${glass.glass_id}`)"
      >
        <h3 class="font-bold text-lg text-gray-800">{{ glass.model }}</h3>
        <p class="text-sm text-gray-500 mb-2">{{ glass.brand }}</p>

        <div
          class="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600 mt-auto"
        >
          {{ glass.volume }} ml
        </div>
      </div>
    </div>

    <div v-if="!loading && glassware.length === 0" class="text-center mt-10 text-gray-500">
      <p>No glassware found. Click "Add Glass" to start.</p>
    </div>
  </div>
</template>
