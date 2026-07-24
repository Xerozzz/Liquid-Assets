<script>
import { getGlasswareById, deleteGlassware } from '@/api/glassware'
import { useNotificationStore } from '@/stores/notification.store'
import DeleteDialog from '../DeleteDialog.vue'

export default {
  name: 'GlasswareSpecific',
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      loading: true,
      glass: null,
      error: null,
    }
  },
  methods: {
    async fetchData() {
      try {
        this.loading = true
        const id = this.$route.params.id

        const result = await getGlasswareById(id)

        if (!result) {
          this.error = new Error('Glassware not found')
          return
        }

        this.glass = result
      } catch (err) {
        this.error = err
        this.notification.notify({
          message: `Error fetching glass: ${err.message}`,
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Glassware',
        message: 'This action cannot be undone. Do you want to proceed?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Delete',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        rejectClass: 'p-button-text',
        accept: () => {
          this.deleteItem()
        },
      })
    },
    async deleteItem() {
      try {
        await deleteGlassware(this.glass.glass_id)

        this.notification.notify({
          message: `Glassware deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace('/glassware')
      } catch (error) {
        console.error(error)
        this.notification.notify({
          message: 'Error deleting glassware',
          severity: 'error',
        })
      }
    },
  },
  mounted() {
    this.fetchData()
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
    <button class="nav_button" @click="$router.push('/glassware')">Back</button>
    <button class="nav_button" @click="$router.push(`/glassware/edit/${glass.glass_id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-11 mt-6">
      <div class="sectionbox">
        <h2 class="title">{{ glass.model }}</h2>
        <h3 class="text-xl font-bold text-gray-600">{{ glass.brand }}</h3>

        <div class="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p class="font-bold">Total Volume:</p>
            <p class="text-2xl font-bold text-primary-700">{{ glass.volume }} ml</p>
          </div>

          <div>
            <p class="font-bold">Fill Volume:</p>
            <p class="text-2xl font-bold text-primary-700">
              {{ glass.volume_w_ice ? glass.volume_w_ice + ' ml' : 'N/A' }}
            </p>
          </div>
        </div>

        <div v-if="glass.volume_w_ice && glass.volume" class="mt-4">
          <p class="text-sm text-gray-500">
            Fill Ratio: {{ Math.round((glass.volume_w_ice / glass.volume) * 100) }}%
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
