<script>
import { getCocktail, importCocktailFromCSV } from '@/api/cocktail.js'
import { getIngredients } from '@/api/ingredients.js'
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
      // Import State
      isImporting: false,
      importStats: { total: 0, success: 0, failed: 0, missingIngredients: [] },
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
      // Handles CSV lines with quoted values containing newlines/commas
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

        // Find header index to map columns
        const headers = this.parseCSVLine(lines[0] || '').map((h) => h.toLowerCase())
        const nameIdx = headers.indexOf('cocktail')
        const remarksIdx = headers.indexOf('remarks')

        // Identify ingredient pair columns
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

          // Handle multi-line cells
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
              cocktailsToImport.push({ name, instructions, ingredients })
            }
          }
          i++
        }

        this.importStats.total = cocktailsToImport.length
        console.log(`Found ${cocktailsToImport.length} cocktails to import`)

        for (const cocktail of cocktailsToImport) {
          const res = await importCocktailFromCSV(cocktail, dbIngredients)
          if (res.success) {
            this.importStats.success++
            if (res.unknowns.length > 0) {
              this.importStats.missingIngredients.push({ cocktail: res.name, items: res.unknowns })
            }
          } else {
            this.importStats.failed++
            // Log specific error for debugging
            console.error(`Failed to import ${cocktail.name}: ${res.error}`)
          }
        }

        let msg = `Imported ${this.importStats.success} cocktails.`
        let severity = 'success'

        if (this.importStats.failed > 0) {
          msg += ` Failed: ${this.importStats.failed}. Check console for details.`
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
    <div class="flex gap-2 mb-2 items-center">
      <button class="nav_button" @click="$router.push('/')">Back</button>
      <button class="nav_button" @click="$router.push('/cocktail/create')">Create Cocktail</button>

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
          chooseLabel="Import Cocktails"
          class="p-button-sm"
          :disabled="isImporting"
        />
      </div>
    </div>

    <h1 class="title mt-0 mb-6">Cocktail Menu</h1>

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
        </div>
      </div>
    </div>

    <div v-if="!loading && queryResult.length === 0" class="text-center py-20 text-gray-400">
      <p>No cocktails found. Click "Create Cocktail" or "Import" to start mixing!</p>
    </div>
  </div>
</template>
