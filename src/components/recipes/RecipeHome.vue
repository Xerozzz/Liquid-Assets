<script>
import { getRecipe, importRecipeFromCSV } from '@/api/recipe.js'
import { getIngredients } from '@/api/ingredients.js'
import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'
import RecipePlaceholder from '@/components/RecipePlaceholder.vue'

export default {
  name: 'RecipeHome',
  components: { RecipePlaceholder },
  setup() {
    const notification = useNotificationStore()
    const { getImageUrl } = useImageStorage()
    return { notification, getImageUrl }
  },
  data() {
    return {
      loading: true,
      queryResult: [],
      queryError: null,
      // Import State
      isImporting: false,
      importStats: { total: 0, success: 0, failed: 0, missingIngredients: [] },

      // Filters
      searchQuery: '',
      stockOnly: false,
      maxCost: null,
      ingredientFilter: '',
      sortBy: 'name_asc',
      sortOptions: [
        { label: 'Name (A-Z)', value: 'name_asc' },
        { label: 'Name (Z-A)', value: 'name_desc' },
        { label: 'Cost (Low to High)', value: 'cost_asc' },
        { label: 'Cost (High to Low)', value: 'cost_desc' },
        { label: 'Missing Ingredients (Most First)', value: 'missing_desc' },
        { label: 'Margin % (Low to High)', value: 'margin_asc' },
        { label: 'Margin % (High to Low)', value: 'margin_desc' },
      ],
    }
  },
  computed: {
    isMocktail() {
      return this.$route.meta.isMocktail === true
    },
    basePath() {
      return this.isMocktail ? '/mocktail' : '/cocktail'
    },
    pageTitle() {
      return this.isMocktail ? 'Mocktail Menu' : 'Cocktail Menu'
    },
    itemLabel() {
      return this.isMocktail ? 'Mocktail' : 'Cocktail'
    },
    filteredCocktails() {
      const filtered = this.queryResult.filter((cocktail) => {
        // Search (Name)
        const matchesSearch =
          !this.searchQuery || cocktail.name.toLowerCase().includes(this.searchQuery.toLowerCase())

        // Stock Filter (missing_count must be 0)
        const matchesStock = !this.stockOnly || cocktail.missing_count === 0

        // Ingredient Filter (Search in raw and hm ingredient strings)
        const matchesIngredient =
          !this.ingredientFilter ||
          (cocktail.raw_ingredients_str &&
            cocktail.raw_ingredients_str
              .toLowerCase()
              .includes(this.ingredientFilter.toLowerCase())) ||
          (cocktail.hm_ingredients_str &&
            cocktail.hm_ingredients_str.toLowerCase().includes(this.ingredientFilter.toLowerCase()))

        return matchesSearch && matchesStock && matchesIngredient
      })

      const sorted = [...filtered]
      switch (this.sortBy) {
        case 'name_desc':
          sorted.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'cost_asc':
          sorted.sort((a, b) => (a.total_cost || 0) - (b.total_cost || 0))
          break
        case 'cost_desc':
          sorted.sort((a, b) => (b.total_cost || 0) - (a.total_cost || 0))
          break
        case 'missing_desc':
          sorted.sort((a, b) => (b.missing_count || 0) - (a.missing_count || 0))
          break
        case 'margin_asc':
        case 'margin_desc': {
          const priced = sorted.filter((c) => c.sale_price > 0)
          const unpriced = sorted.filter((c) => !(c.sale_price > 0))
          priced.sort((a, b) => {
            const diff = this.marginPercent(a) - this.marginPercent(b)
            return this.sortBy === 'margin_asc' ? diff : -diff
          })
          return [...priced, ...unpriced]
        }
        default:
          sorted.sort((a, b) => a.name.localeCompare(b.name))
      }
      return sorted
    },
  },
  watch: {
    // Update URL when filters change
    searchQuery(newVal) {
      this.updateUrlQuery('q', newVal)
    },
    ingredientFilter(newVal) {
      this.updateUrlQuery('ing', newVal)
    },
    stockOnly(newVal) {
      this.updateUrlQuery('stock', newVal ? '1' : null)
    },
    sortBy(newVal) {
      this.updateUrlQuery('sort', newVal === 'name_asc' ? null : newVal)
    },
    '$route.meta.isMocktail'() {
      this.retrieveCocktails()
    },
  },
  methods: {
    marginPercent(cocktail) {
      if (!(cocktail.sale_price > 0)) return null
      return ((cocktail.sale_price - (cocktail.total_cost || 0)) / cocktail.sale_price) * 100
    },
    updateUrlQuery(key, value) {
      const query = { ...this.$route.query }
      if (value) {
        query[key] = value
      } else {
        delete query[key]
      }
      this.$router.replace({ query }).catch(() => {})
    },

    async retrieveCocktails() {
      try {
        this.loading = true
        const rawResult = await getRecipe(this.isMocktail ? 'mocktail' : 'cocktail')
        this.queryResult = await Promise.all(
          rawResult.map(async (cocktail) => ({
            ...cocktail,
            displayImageUrl: cocktail.image ? await this.getImageUrl(cocktail.image) : null,
          })),
        )

        // Restore filters from URL
        const q = this.$route.query
        if (q.q) this.searchQuery = q.q
        if (q.ing) this.ingredientFilter = q.ing
        if (q.stock) this.stockOnly = q.stock === '1'
        if (q.sort) this.sortBy = q.sort
      } catch (error) {
        this.queryError = error
        this.notification.notify({
          message: `Failed to load ${this.itemLabel.toLowerCase()}s`,
          severity: 'error',
        })
      } finally {
        this.loading = false
      }
    },

    // --- CSV IMPORT LOGIC ---
    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        console.log('File loaded, length:', text.length)
        this.processCocktailCSV(text)
      }
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

    async processCocktailCSV(csvText) {
      this.isImporting = true
      this.importStats = { total: 0, success: 0, failed: 0, missingIngredients: [] }

      try {
        const dbIngredients = await getIngredients()

        const lines = csvText.split(/\r\n|\n/)
        const headers = this.parseCSVLine(lines[0] || '').map((h) => h.toLowerCase())
        const nameIdx = headers.indexOf('cocktail')
        const remarksIdx = headers.indexOf('remarks')

        const ingredientMap = []
        for (let i = 0; i < headers.length; i++) {
          if (headers[i].startsWith('ingredient')) {
            const num = headers[i].replace('ingredient', '').trim()
            const amtHeader = `amount ${num}`
            const amtIdx = headers.findIndex((h) => h.includes(amtHeader) || h === `amount${num}`)

            if (amtIdx !== -1) {
              ingredientMap.push({ nameIdx: i, amountIdx: amtIdx })
            }
          }
        }

        if (nameIdx === -1) throw new Error("CSV missing 'Cocktail' column")

        const cocktailsToImport = []
        let i = 1
        while (i < lines.length) {
          let line = lines[i]
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
          const instructions = cols[remarksIdx]?.replace(/^"|"$/g, '') || ''

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

            if (ingredients.length > 0) {
              cocktailsToImport.push({
                name,
                instructions,
                ingredients,
                isMocktail: this.isMocktail,
              })
            }
          }
          i++
        }

        this.importStats.total = cocktailsToImport.length

        for (const cocktail of cocktailsToImport) {
          const res = await importRecipeFromCSV(cocktail, dbIngredients)
          if (res.success) {
            this.importStats.success++
            if (res.unknowns.length > 0) {
              this.importStats.missingIngredients.push({ cocktail: res.name, items: res.unknowns })
            }
          } else {
            this.importStats.failed++
            console.error(`Failed to import ${cocktail.name}: ${res.error}`)
          }
        }

        let msg = `Imported ${this.importStats.success} ${this.itemLabel.toLowerCase()}s.`
        let severity = 'success'

        if (this.importStats.failed > 0) {
          msg += ` Failed: ${this.importStats.failed}. Check console.`
          severity = 'error'
        } else if (this.importStats.missingIngredients.length > 0) {
          msg += ` Warning: Some ingredients unmatched.`
          severity = 'warn'
          console.warn('Missing Ingredients Report:', this.importStats.missingIngredients)
        }

        this.notification.notify({ message: msg, severity })
        await this.retrieveCocktails()
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

    csvEscape(value) {
      const str = String(value ?? '')
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    },

    exportMenuCsv() {
      const headers = ['Name', 'Cost', 'Sale Price', 'Margin %', 'Ingredients']
      const rows = this.filteredCocktails.map((c) => {
        const margin = this.marginPercent(c)
        return [
          c.name,
          Number(c.total_cost || 0).toFixed(2),
          c.sale_price != null ? Number(c.sale_price).toFixed(2) : '',
          margin != null ? margin.toFixed(0) : '',
          c.raw_ingredients_str || '',
        ]
          .map(this.csvEscape)
          .join(',')
      })
      const csv = [headers.join(','), ...rows].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${this.itemLabel.toLowerCase()}-menu-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    },
  },
  mounted() {
    this.retrieveCocktails()
  },
}
</script>

<template>
  <div class="bodysection">
    <div class="flex flex-wrap gap-2 mb-2 items-center">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push(`${basePath}/create`)">
        Create {{ itemLabel }}
      </button>
      <button class="nav_button" @click="exportMenuCsv" :disabled="filteredCocktails.length === 0">
        Export Menu (CSV)
      </button>

      <!-- Import Button -->
      <div class="ml-auto">
        <FileUpload
          mode="basic"
          name="cocktailCsv"
          accept=".csv"
          :maxFileSize="5000000"
          :auto="true"
          customUpload
          @select="onFileSelect"
          :chooseLabel="`Import ${itemLabel}s`"
          class="p-button-sm"
          :disabled="isImporting"
        />
      </div>
    </div>

    <h1 class="title mt-0 mb-4">{{ pageTitle }}</h1>

    <!-- FILTERS BAR -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase">Search Name</label>
          <InputText v-model="searchQuery" placeholder="e.g. Negroni" class="p-inputtext-sm" />
        </div>

        <!-- Ingredient Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase">Filter Ingredient</label>
          <InputText v-model="ingredientFilter" placeholder="e.g. Gin" class="p-inputtext-sm" />
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

        <!-- Stock Toggle -->
        <div class="flex items-center gap-2 pt-5">
          <Checkbox v-model="stockOnly" :binary="true" inputId="stockFilter" />
          <label for="stockFilter" class="text-sm font-medium cursor-pointer select-none">
            Only In Stock
          </label>
        </div>

        <!-- Results Count -->
        <div class="flex items-center justify-end pt-5 text-sm text-gray-500">
          Showing {{ filteredCocktails.length }} / {{ queryResult.length }}
        </div>
      </div>
    </div>

    <!-- LOADING -->
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

    <!-- GRID -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="cocktail in filteredCocktails"
        :key="cocktail.recipe_id"
        class="bg-white rounded-lg shadow-sm border border-primary-100 overflow-hidden hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col relative"
        @click="$router.push(`${basePath}/view/${cocktail.recipe_id}`)"
      >
        <!-- Stock Warning Overlay if missing ingredients -->
        <div v-if="cocktail.missing_count > 0" class="absolute top-2 right-2 z-10">
          <span
            class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200"
          >
            Missing {{ cocktail.missing_count }}
          </span>
        </div>

        <div class="h-48 w-full bg-gray-50 relative border-b border-gray-100">
          <img
            v-if="cocktail.displayImageUrl"
            :src="cocktail.displayImageUrl"
            :alt="cocktail.name"
            class="w-full h-full object-cover"
          />
          <RecipePlaceholder v-else :name="cocktail.name" />
        </div>

        <div class="p-4 text-center">
          <h3 class="font-bold text-xl text-gray-800">{{ cocktail.name }}</h3>
          <div class="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <p class="font-bold text-primary-700">${{ (cocktail.total_cost || 0).toFixed(2) }}</p>
            <template v-if="cocktail.sale_price != null">
              <span class="text-gray-300">/</span>
              <p class="font-bold text-gray-700">${{ Number(cocktail.sale_price).toFixed(2) }}</p>
              <span
                v-if="cocktail.sale_price > 0"
                :class="[
                  'px-1.5 py-0.5 rounded text-xs font-bold',
                  cocktail.sale_price - cocktail.total_cost >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
                ]"
              >
                {{
                  (
                    ((cocktail.sale_price - cocktail.total_cost) / cocktail.sale_price) *
                    100
                  ).toFixed(0)
                }}%
              </span>
            </template>
          </div>
          <p v-if="cocktail.raw_ingredients_str" class="text-xs text-gray-400 mt-1 truncate">
            {{ cocktail.raw_ingredients_str }}
          </p>
        </div>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-if="!loading && filteredCocktails.length === 0" class="text-center py-20 text-gray-400">
      <p v-if="queryResult.length > 0">No matches found for your filters.</p>
      <p v-else>
        No {{ itemLabel.toLowerCase() }}s found. Click "Create {{ itemLabel }}" or "Import" to start
        mixing!
      </p>
    </div>
  </div>
</template>
