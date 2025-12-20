<script>
import { getIngredients, createMultipleIngredients } from '@/api/ingredients.js'
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
      // Import State
      showImportDialog: false,
      parsedIngredients: [],
      isImporting: false,
      duplicateIngredients: [],
      skipDuplicates: true, // Default behavior
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

    // --- CSV Parsing Logic ---
    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.parseCSV(e.target.result)
      }
      reader.readAsText(file)
    },

    parseNumber(value) {
      if (!value) return 0
      // Remove '$' and ',' then parse
      const cleanValue = value.replace(/[$,]/g, '')
      const num = parseFloat(cleanValue)
      return isNaN(num) ? 0 : num
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

        const nameIndex = headers.findIndex((h) => h === 'item')
        const costPerMlIndex = headers.findIndex((h) => h === '$/ml')
        const costIndex = headers.findIndex((h) => h === 'cost')
        const sizeIndex = headers.findIndex((h) => h === 'size')
        const unitIndex = headers.findIndex((h) => h === 'unit')

        if (nameIndex === -1) {
          this.notification.notify({ message: 'CSV must have an "Item" column', severity: 'error' })
          return
        }

        const data = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // Handle simple CSV splitting (doesn't handle commas inside quotes)
          const cols = line.split(',')
          const name = cols[nameIndex]?.trim()

          let unitCost = 0

          // Use explicit $/ml column
          if (costPerMlIndex !== -1 && cols[costPerMlIndex]) {
            unitCost = this.parseNumber(cols[costPerMlIndex])
          }
          // Calculate from Cost / Size
          else if (costIndex !== -1 && sizeIndex !== -1) {
            const total = this.parseNumber(cols[costIndex])
            const size = this.parseNumber(cols[sizeIndex])
            if (size > 0) unitCost = total / size
          }

          // Determine Unit, otherwise default to 'ml'
          const unit = unitIndex !== -1 && cols[unitIndex] ? cols[unitIndex].trim() : 'ml'
          if (name) {
            data.push({
              name: name,
              cost: Number(unitCost.toFixed(2)),
              unit: unit,
              is_stocked: true,
            })
          }
        }

        if (data.length > 0) {
          this.parsedIngredients = data
          this.checkForDuplicates()
          this.showImportDialog = true
        } else {
          this.notification.notify({
            message: 'No valid ingredients found in file',
            severity: 'warn',
          })
        }
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to parse CSV', severity: 'error' })
      }
    },

    checkForDuplicates() {
      // Check for duplicates against existing ingredients
      const existingNames = this.queryResult.map((ing) => ing.name.toLowerCase())
      this.duplicateIngredients = this.parsedIngredients.filter((ing) =>
        existingNames.includes(ing.name.toLowerCase()),
      )
    },

    resetImportState() {
      this.showImportDialog = false
      this.parsedIngredients = []
      this.duplicateIngredients = []
    },

    async confirmImport() {
      this.isImporting = true
      try {
        // Filter out duplicates if skipDuplicates is enabled
        let ingredientsToImport = this.parsedIngredients
        if (this.skipDuplicates && this.duplicateIngredients.length > 0) {
          const duplicateNames = this.duplicateIngredients.map((ing) => ing.name.toLowerCase())
          ingredientsToImport = this.parsedIngredients.filter(
            (ing) => !duplicateNames.includes(ing.name.toLowerCase()),
          )
        }

        if (ingredientsToImport.length === 0) {
          this.notification.notify({
            message: 'No new ingredients to import (all are duplicates)',
            severity: 'warn',
          })
          this.resetImportState()
          this.isImporting = false
          return
        }

        await createMultipleIngredients(ingredientsToImport)

        const skippedCount = this.parsedIngredients.length - ingredientsToImport.length
        let message = `Successfully imported ${ingredientsToImport.length} ingredient${ingredientsToImport.length !== 1 ? 's' : ''}`
        if (skippedCount > 0) {
          message += `, skipped ${skippedCount} duplicate${skippedCount !== 1 ? 's' : ''}`
        }

        this.notification.notify({
          message,
          severity: 'success',
        })
        this.resetImportState()
        await this.retrieveIngredients()
      } catch (error) {
        console.error(error)
        this.notification.notify({
          message: 'Import failed: ' + (error && error.message ? error.message : String(error)),
          severity: 'error',
        })
      } finally {
        this.isImporting = false
      }
    },

    formatCurrency(value) {
      return `$${Number(value).toFixed(2)}`
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
    <!-- Header Controls -->
    <div class="flex flex-wrap gap-2 mb-2 items-center">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push('/ingredient/create')">Add Ingredient</button>

      <!-- Import Button -->
      <div class="ml-auto justify-end">
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

    <h1 class="title mt-0 mb-6">Pantry & Ingredients</h1>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Ingredient Grid -->
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

    <!-- Empty State -->
    <div v-if="!loading && queryResult.length === 0" class="text-center py-20 text-gray-400">
      <p>No ingredients found. Click "Add Ingredient" or "Import CSV" to start.</p>
    </div>

    <!-- Import Preview Dialog -->
    <Dialog
      v-model:visible="showImportDialog"
      modal
      header="Review Import"
      :style="{ width: '80vw', maxWidth: '900px' }"
    >
      <!-- Duplicate Warning -->
      <div
        v-if="duplicateIngredients.length > 0"
        class="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg"
      >
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
          <div class="flex-1">
            <p class="font-semibold text-yellow-800 mb-2">
              {{ duplicateIngredients.length }} duplicate ingredient{{
                duplicateIngredients.length !== 1 ? 's' : ''
              }}
              detected
            </p>
            <p class="text-sm text-yellow-700 mb-2">
              The following ingredients already exist in your database:
              <strong>{{ duplicateIngredients.map((ing) => ing.name).join(', ') }}</strong>
            </p>
            <div class="flex items-center gap-2 mt-3">
              <Checkbox v-model="skipDuplicates" inputId="skipDuplicates" :binary="true" />
              <label for="skipDuplicates" class="text-sm text-yellow-800 cursor-pointer">
                Skip duplicate ingredients (recommended)
              </label>
            </div>
          </div>
        </div>
      </div>

      <p class="mb-4 text-gray-600">
        Review the data below. You can click on <b>Cost</b> or <b>Unit</b> to edit them before
        importing.
      </p>

      <DataTable
        :value="parsedIngredients"
        scrollable
        scrollHeight="400px"
        editMode="cell"
        @cell-edit-complete="
          (e) => {
            parsedIngredients[e.index][e.field] = e.newValue
          }
        "
        tableClass="editable-cells-table"
        stripedRows
        showGridlines
      >
        <Column field="name" header="Name">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span>{{ data.name }}</span>
              <i
                v-if="
                  duplicateIngredients.some(
                    (dup) => dup.name.toLowerCase() === data.name.toLowerCase(),
                  )
                "
                class="pi pi-exclamation-circle text-yellow-600"
                title="Duplicate ingredient"
              ></i>
            </div>
          </template>
        </Column>

        <Column field="cost" header="Cost">
          <template #body="{ data }">
            {{ formatCurrency(data.cost) }}
          </template>
          <template #editor="{ data, field }">
            <InputNumber
              v-model="data[field]"
              :minFractionDigits="4"
              :maxFractionDigits="6"
              fluid
            />
          </template>
        </Column>

        <Column field="unit" header="Unit (Edit)">
          <template #body="{ data }">
            <span class="text-blue-600 font-bold">{{ data.unit }}</span>
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid />
          </template>
        </Column>

        <Column field="is_stocked" header="Stocked">
          <template #body="{ data }">
            <Checkbox v-model="data.is_stocked" :binary="true" />
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
/* Highlight editable cells */
:deep(.editable-cells-table .p-editable-column:hover) {
  background-color: #eff6ff;
  cursor: pointer;
}
</style>
