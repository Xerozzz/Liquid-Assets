<script>
import { useNotificationStore } from '@/stores/notification.store'
import {
  getHmIngredient,
  importHmIngredientFromCSV,
  updateHmIngredient,
} from '@/api/hm_ingredients.js'
import { getIngredients } from '@/api/ingredients.js'
import { useImageStorage } from '@/composables/useImageStorage'
import RecipePlaceholder from '@/components/RecipePlaceholder.vue'

export default {
  name: 'HmIngredientHome',
  components: { RecipePlaceholder },
  setup() {
    const notification = useNotificationStore()
    const { getImageUrl } = useImageStorage()
    return { notification, getImageUrl }
  },
  data() {
    return {
      loading: true,
      hmIngredients: [],
      isImporting: false,
      importStats: { total: 0, success: 0, failed: 0, missingIngredients: [] },
      searchQuery: '',
      togglingId: null,
      sortBy: 'name_asc',
      sortOptions: [
        { label: 'Name (A-Z)', value: 'name_asc' },
        { label: 'Name (Z-A)', value: 'name_desc' },
        { label: 'Cost (Low to High)', value: 'cost_asc' },
        { label: 'Cost (High to Low)', value: 'cost_desc' },
        { label: 'Out of Stock First', value: 'stock_asc' },
      ],
    }
  },
  computed: {
    filteredIngredients() {
      const filtered = this.hmIngredients.filter((item) => {
        const matchesSearch =
          !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        return matchesSearch
      })

      const sorted = [...filtered]
      switch (this.sortBy) {
        case 'name_desc':
          sorted.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'cost_asc':
          sorted.sort((a, b) => a.cost - b.cost)
          break
        case 'cost_desc':
          sorted.sort((a, b) => b.cost - a.cost)
          break
        case 'stock_asc':
          sorted.sort((a, b) => Number(a.is_stocked) - Number(b.is_stocked))
          break
        default:
          sorted.sort((a, b) => a.name.localeCompare(b.name))
      }
      return sorted
    },
  },
  watch: {
    searchQuery(newVal) {
      this.updateUrlQuery('q', newVal)
    },
    sortBy(newVal) {
      this.updateUrlQuery('sort', newVal === 'name_asc' ? null : newVal)
    },
  },
  methods: {
    // --- Helper to update URL without reloading ---
    updateUrlQuery(key, value) {
      const query = { ...this.$route.query }
      if (value) {
        query[key] = value
      } else {
        delete query[key]
      }
      this.$router.replace({ query }).catch(() => {})
    },

    async getData() {
      this.loading = true
      try {
        const rawData = await getHmIngredient()

        // Restore filter from URL
        const q = this.$route.query
        if (q.q) this.searchQuery = q.q
        if (q.sort) this.sortBy = q.sort

        this.hmIngredients = await Promise.all(
          rawData.map(async (item) => ({
            ...item,
            displayImageUrl: item.image ? await this.getImageUrl(item.image) : null,
          })),
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

    async toggleStock(item, event) {
      event.stopPropagation()
      this.togglingId = item.hm_ingredient_id
      try {
        const updated = await updateHmIngredient(
          item.name,
          item.cost,
          item.notes,
          item.image,
          item.unit,
          item.yield,
          !item.is_stocked,
          item.hm_ingredient_id,
        )
        item.is_stocked = updated.is_stocked
        this.notification.notify({
          message: `${item.name} marked as ${item.is_stocked ? 'In Stock' : 'Out of Stock'}`,
          severity: 'success',
        })
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Failed to update stock status', severity: 'error' })
      } finally {
        this.togglingId = null
      }
    },

    // --- CSV IMPORT LOGIC ---
    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()
      reader.onload = (e) => this.processCSV(e.target.result)
      reader.onerror = (e) => console.error('File read error', e)
      reader.readAsText(file)
    },

    parseCSVLine(line) {
      const result = []
      let current = ''
      let inQuote = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuote = !inQuote
        } else if (char === ',' && !inQuote) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    },

    async processCSV(csvText) {
      this.isImporting = true
      this.importStats = { total: 0, success: 0, failed: 0, missingIngredients: [] }

      try {
        // Get Raw DB Ingredients
        const dbIngredients = await getIngredients()
        console.log(`Loaded ${dbIngredients.length} raw ingredients from DB for matching.`)

        const lines = csvText.split(/\r\n|\n/)
        const headers = this.parseCSVLine(lines[0] || '').map((h) => h.toLowerCase())

        const nameIdx = headers.indexOf('product')
        const yieldIdx = headers.findIndex((h) => h.includes('expected yield') || h === 'yield')

        // Map dynamic columns
        const ingredientMap = []
        for (let i = 0; i < headers.length; i++) {
          // Check for "Ingredient_1", "Ingredient 1", "Ingredient1"
          if (headers[i].includes('ingredient')) {
            // Extract number
            const match = headers[i].match(/\d+/)
            if (match) {
              const num = match[0]
              // Find corresponding Amount column
              const amtIdx = headers.findIndex((h) => h.includes('amount') && h.includes(num))

              if (amtIdx !== -1) {
                ingredientMap.push({ nameIdx: i, amountIdx: amtIdx })
              }
            }
          }
        }

        if (nameIdx === -1) throw new Error("CSV missing 'Product' column")

        // Parse Rows
        const itemsToImport = []
        let i = 1
        while (i < lines.length) {
          let line = lines[i]
          // Multiline quote handling
          while ((line.match(/"/g) || []).length % 2 !== 0 && i < lines.length - 1) {
            i++
            line += '\n' + lines[i]
          }

          if (!line.trim()) {
            i++
            continue
          }

          const cols = this.parseCSVLine(line)
          const name = cols[nameIdx]?.replace(/^"|"$/g, '')
          const yieldAmt = parseFloat(cols[yieldIdx]) || 0

          if (name) {
            const ingredients = []
            ingredientMap.forEach((pair) => {
              const ingName = cols[pair.nameIdx]
              const ingAmt = parseFloat(cols[pair.amountIdx])

              if (ingName && ingAmt > 0) {
                ingredients.push({
                  name: ingName.replace(/^"|"$/g, ''),
                  amount: ingAmt,
                })
              }
            })

            itemsToImport.push({ name, yield: yieldAmt, ingredients })
          }
          i++
        }

        this.importStats.total = itemsToImport.length

        // Import
        for (const item of itemsToImport) {
          const res = await importHmIngredientFromCSV(item, dbIngredients)
          if (res.success) {
            this.importStats.success++
            if (res.unknowns.length > 0) {
              this.importStats.missingIngredients.push({ item: res.name, components: res.unknowns })
            }
          } else {
            this.importStats.failed++
            console.error(`Failed to import ${item.name}: ${res.error}`)
          }
        }

        // Feedback
        let msg = `Imported ${this.importStats.success} items.`
        let severity = 'success'

        if (this.importStats.failed > 0) {
          msg += ` Failed: ${this.importStats.failed}. Check console.`
          severity = 'warn'
        } else if (this.importStats.missingIngredients.length > 0) {
          msg += ` Warning: Some components could not be matched.`
          severity = 'warn'
          console.warn('Unmatched components:', this.importStats.missingIngredients)
        }

        this.notification.notify({ message: msg, severity })
        await this.getData()
      } catch (err) {
        console.error(err)
        this.notification.notify({
          message: 'CSV Import Failed: ' + err.message,
          severity: 'error',
        })
      } finally {
        this.isImporting = false
      }
    },
  },
  mounted() {
    this.getData()
  },
}
</script>

<template>
  <div class="bodysection">
    <div class="flex flex-wrap gap-2 mb-2 items-center">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push('/hm/create')">
        Create Homemade Ingredient
      </button>

      <!-- Import Button -->
      <div class="ml-auto">
        <FileUpload
          mode="basic"
          name="hmCsv"
          accept=".csv"
          :maxFileSize="2000000"
          :auto="true"
          customUpload
          @select="onFileSelect"
          chooseLabel="Import CSV"
          class="p-button-sm"
          :disabled="isImporting"
        />
      </div>
    </div>

    <h1 class="title mt-0 mb-6">Homemade Ingredients</h1>

    <!-- FILTERS BAR -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase">Search Name</label>
          <InputText v-model="searchQuery" placeholder="e.g. Syrup" class="p-inputtext-sm" />
        </div>

        <!-- Sort -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase">Sort By</label>
          <Select
            v-model="sortBy"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            class="p-inputtext-sm"
          />
        </div>
      </div>
    </div>
    <div
      v-if="loading || isImporting"
      class="flex flex-col items-center justify-center py-20 gap-4"
    >
      <ProgressSpinner />
      <span v-if="isImporting" class="text-gray-500">
        Parsing & Importing
        {{ importStats.total > 0 ? importStats.success + '/' + importStats.total : '...' }}
      </span>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="item in filteredIngredients"
        :key="item.hm_ingredient_id"
        class="bg-white rounded-lg shadow-sm border border-primary-100 overflow-hidden hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col"
        @click="$router.push(`/hm/view/${item.hm_ingredient_id}`)"
      >
        <div class="h-48 w-full bg-gray-50 relative border-b border-gray-100">
          <img
            v-if="item.displayImageUrl"
            :src="item.displayImageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <RecipePlaceholder v-else :name="item.name" />

          <div class="absolute top-2 right-2">
            <button
              type="button"
              :disabled="togglingId === item.hm_ingredient_id"
              @click="toggleStock(item, $event)"
              :title="item.is_stocked ? 'Click to mark Out of Stock' : 'Click to mark In Stock'"
              :class="[
                'px-2 py-1 rounded-md font-bold text-xs transition-colors disabled:opacity-50',
                item.is_stocked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200',
              ]"
            >
              {{ item.is_stocked ? 'In Stock' : 'Out' }}
            </button>
          </div>
        </div>

        <div class="p-4 flex flex-col justify-between flex-grow">
          <div class="text-center mb-4">
            <h3 class="font-bold text-xl text-gray-800">{{ item.name }}</h3>
            <span class="text-xs text-gray-500">Yield: {{ item.yield }} {{ item.unit }}</span>
          </div>

          <hr class="border-primary-100 mb-4" />

          <div class="flex justify-between items-center text-sm">
            <div>
              <p class="font-bold text-primary-700">
                {{ formatCurrency(item.cost) }} / {{ item.unit }}
              </p>
            </div>

            <div class="text-gray-400 text-xs uppercase font-semibold">View</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredIngredients.length === 0"
      class="text-center py-20 text-gray-400"
    >
      <p v-if="hmIngredients.length === 0">
        No homemade ingredients found. Click "Create" or "Import" to start cooking!
      </p>
      <p v-else>No matches found for "{{ searchQuery }}".</p>
    </div>
  </div>
</template>
