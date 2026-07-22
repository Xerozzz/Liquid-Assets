<script>
import { getGlassware, createMultipleGlassware } from '@/api/glassware.js'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'GlasswareHome',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      loading: true,
      glasswareList: [],
      showImportDialog: false,
      parsedGlassware: [],
      isImporting: false,
    }
  },
  methods: {
    async retrieveGlassware() {
      try {
        this.loading = true
        this.glasswareList = await getGlassware()
      } catch {
        this.notification.notify({
          message: 'Failed to load glassware',
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },

    // --- CSV Parsing Logic ---
    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.parseCSV(e.target.result)
      }
      reader.readAsText(file)
    },

    parseCSV(csvText) {
      try {
        const lines = csvText.split(/\r\n|\n/)
        if (lines.length === 0) return

        // Clean headers
        const headers = lines[0].split(',').map((h) =>
          h
            .replace(/^\uFEFF/, '')
            .trim()
            .toLowerCase(),
        )

        const brandIdx = headers.findIndex((h) => h === 'brand')
        const modelIdx = headers.findIndex((h) => h === 'model')
        const volIdx = headers.findIndex((h) => h === 'volume')
        const fillIdx = headers.findIndex((h) => h === 'volume_w_ice' || h === 'fill')

        if (brandIdx === -1 || modelIdx === -1) {
          this.notification.notify({
            message: 'CSV must have "brand" and "model" columns',
            severity: 'error',
          })
          return
        }

        const data = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const cols = line.split(',') // Simple split assumes no commas in values
          const brand = cols[brandIdx]?.trim()
          const model = cols[modelIdx]?.trim()

          const volume = parseFloat(cols[volIdx]) || 0
          const fill = parseFloat(cols[fillIdx]) || 0

          if (brand && model) {
            data.push({
              brand,
              model,
              volume,
              volume_w_ice: fill,
            })
          }
        }

        if (data.length > 0) {
          this.parsedGlassware = data
          this.showImportDialog = true
        } else {
          this.notification.notify({
            message: 'No valid glassware found in file',
            severity: 'warn',
          })
        }
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to parse CSV', severity: 'error' })
      }
    },

    async confirmImport() {
      this.isImporting = true
      try {
        await createMultipleGlassware(this.parsedGlassware)
        this.notification.notify({
          message: `Successfully imported ${this.parsedGlassware.length} glassware items`,
          severity: 'success',
        })
        this.showImportDialog = false
        this.parsedGlassware = []
        await this.retrieveGlassware()
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Import failed', severity: 'error' })
      } finally {
        this.isImporting = false
      }
    },
  },
  mounted() {
    this.retrieveGlassware()
  },
}
</script>

<template>
  <div class="bodysection">
    <!-- Header -->
    <div class="flex flex-wrap gap-2 mb-2 items-center">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push('/glassware/create')">Add Glassware</button>

      <!-- Import Button -->
      <div class="ml-auto">
        <FileUpload
          mode="basic"
          name="csv"
          accept=".csv"
          :maxFileSize="1000000"
          :auto="true"
          customUpload
          @select="onFileSelect"
          chooseLabel="Import CSV"
          class="p-button-sm"
        />
      </div>
    </div>

    <h1 class="title mt-0 mb-6">Glassware Inventory</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Grid Layout -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="glass in glasswareList"
        :key="glass.glass_id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
        @click="$router.push(`/glassware/edit/${glass.glass_id}`)"
      >
        <div class="text-center mb-4">
          <h3 class="font-bold text-xl text-gray-800">{{ glass.brand }}</h3>
          <p class="text-gray-500">{{ glass.model }}</p>
        </div>

        <hr class="border-gray-300 mb-4" />

        <div class="flex justify-between items-center text-sm">
          <div>
            <p class="text-gray-600">Total Vol</p>
            <p class="font-bold text-gray-800">{{ glass.volume }} ml</p>
          </div>
          <div class="text-right">
            <p class="text-gray-600">With Ice</p>
            <p class="font-bold text-primary">{{ glass.volume_w_ice }} ml</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && glasswareList.length === 0" class="text-center py-20 text-gray-400">
      <p>No glassware found. Add some or import a CSV!</p>
    </div>

    <!-- Import Preview Dialog -->
    <Dialog
      v-model:visible="showImportDialog"
      modal
      header="Review Glassware Import"
      :style="{ width: '80vw', maxWidth: '900px' }"
    >
      <p class="mb-4 text-gray-600">
        Review the data below. Click on cells to edit before importing.
      </p>

      <DataTable
        :value="parsedGlassware"
        scrollable
        scrollHeight="400px"
        editMode="cell"
        @cell-edit-complete="
          (e) => {
            parsedGlassware[e.index][e.field] = e.newValue
          }
        "
        tableClass="editable-cells-table"
        stripedRows
        showGridlines
      >
        <Column field="brand" header="Brand">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid />
          </template>
        </Column>
        <Column field="model" header="Model">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid />
          </template>
        </Column>
        <Column field="volume" header="Volume (ml)">
          <template #editor="{ data, field }">
            <InputNumber v-model="data[field]" fluid />
          </template>
        </Column>
        <Column field="volume_w_ice" header="Fill Vol (ml)">
          <template #editor="{ data, field }">
            <InputNumber v-model="data[field]" fluid />
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="showImportDialog = false" />
        <Button
          label="Confirm Import"
          icon="pi pi-check"
          @click="confirmImport"
          :loading="isImporting"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.editable-cells-table .p-editable-column:hover) {
  background-color: #eff6ff;
  cursor: pointer;
}
</style>
