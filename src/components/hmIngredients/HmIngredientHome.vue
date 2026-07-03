<script>
import { useNotificationStore } from '@/stores/notification.store'
import { getHmIngredient, importHmIngredientFromCSV } from '@/api/hm_ingredients.js'
import { getIngredients } from '@/api/ingredients.js'
import { useImageStorage } from '@/composables/useImageStorage'

export default {
  name: 'HmIngredientHome',
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
    }
  },
  computed: {
    filteredIngredients() {
      return this.hmIngredients.filter((item) => {
        const matchesSearch =
          !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        return matchesSearch
      })
    },
  },
  watch: {
    searchQuery(newVal) {
      this.updateUrlQuery('q', newVal)
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
    <div class="flex gap-2 mb-2 items-center">
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
      <!-- Search -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-gray-500 uppercase">Search Name</label>
        <InputText v-model="searchQuery" placeholder="e.g. Syrup" class="p-input text-sm" />
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

          <div class="absolute top-2 right-2">
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

        <div class="p-4 flex flex-col justify-between flex-grow">
          <div class="text-center mb-4">
            <h3 class="font-bold text-xl text-gray-800">{{ item.name }}</h3>
            <span class="text-xs text-gray-500">Yield: {{ item.yield }} {{ item.unit }}</span>
          </div>

          <hr class="border-gray-300 mb-4" />

          <div class="flex justify-between items-center text-sm">
            <div>
              <p class="font-bold text-gray-700">
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
