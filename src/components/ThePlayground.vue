<script setup lang="js">
import { useSQLite } from '@/composables/useSQLite'
import { ref, onMounted } from 'vue'
import { queries } from '../config/queries'

const {
  isLoading,
  error,
  executeQuery,
  initialize,
  setIsInitialized,
  resetDatabase: hardResetDatabase,
} = useSQLite()

const sqlQuery = ref('SELECT * FROM glassware')
const sqlTable = ref('glassware')
const queryResult = ref([])
const queryError = ref(null)

async function runQuery() {
  queryError.value = null
  queryResult.value = []

  try {
    const result = await executeQuery(sqlQuery.value)
    const isSelect = sqlQuery.value.trim().toLowerCase().startsWith('select')

    if (isSelect) {
      queryResult.value = result?.result.resultRows || []
    } else {
      const table = sqlTable.value.split(' ')
      queryResult.value = (await executeQuery(`SELECT * FROM ${table[1]}`))?.result.resultRows || []
    }
  } catch (err) {
    queryError.value = err instanceof Error ? err.message : 'An error occurred'
  }
}

/** Soft reset:
 * Drops all schema via SQL and re-initializes.
 * (Keeps the same OPFS file, just empties it.)
 */
async function softResetDatabase() {
  queryError.value = null
  queryResult.value = []
  try {
    const query = `
      PRAGMA writable_schema = 1;
      DELETE FROM sqlite_master WHERE type IN ('table','index','trigger');
      PRAGMA writable_schema = 0;
      VACUUM;
      PRAGMA integrity_check;
    `
    await executeQuery(query)
    setIsInitialized()
    await initialize()
    alert('Soft reset complete (schema dropped & re-seeded).')
  } catch (err) {
    queryError.value = err instanceof Error ? err.message : 'An error occurred'
  }
}

/** Hard reset (recommended):
 * Deletes the OPFS db files and re-seeds from dumps.js.
 * Uses the new composable method.
 */
async function resetToSeed() {
  queryError.value = null
  queryResult.value = []
  try {
    await hardResetDatabase()
    alert('Database reset to seed state (OPFS wiped & re-initialized).')
    await runQuery()
  } catch (err) {
    queryError.value = err instanceof Error ? err.message : 'An error occurred'
  }
}

onMounted(async () => {
  try {
    await initialize()
    await runQuery()
  } catch (e) {
    console.error('Initialization error:', e)
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h2 class="text-2xl font-bold text-black-900">SQLite Playground</h2>

    <div class="mt-4 space-y-2">
      <h3 class="text-sm font-medium text-black-700 dark:text-black-300">Example Queries:</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="example in queries"
          :key="example.title"
          class="px-3 py-1 text-sm rounded-full bg-black-100 hover:bg-black-200 dark:bg-black-800 dark:hover:bg-black-700 text-black-700 dark:text-black-300 transition-colors duration-200"
          @click="((sqlQuery = example.query), (sqlTable = example.title))"
        >
          {{ example.title }}
        </button>
      </div>
      <p class="text-sm text-gray-600">
        The test_table has columns:<br />
        - id (INTEGER PRIMARY KEY AUTOINCREMENT)<br />
        - name (TEXT NOT NULL)<br />
        - created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
      </p>
    </div>

    <div class="mt-6 space-y-4">
      <div class="space-y-2">
        <textarea
          v-model="sqlQuery"
          rows="4"
          placeholder="Enter your SQL query here..."
          :disabled="isLoading"
          class="w-full px-4 py-3 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 transition-colors duration-200"
        />
        <div class="flex flex-wrap gap-2">
          <button
            :disabled="isLoading"
            class="px-4 py-2 rounded-lg text-sm font-medium text-black bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
            @click="runQuery"
          >
            {{ isLoading ? 'Running...' : 'Run Query' }}
          </button>

          <button
            :disabled="isLoading"
            class="px-4 py-2 rounded-lg text-sm font-medium text-black bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors duration-200"
            @click="resetToSeed"
            title="Delete OPFS DB files and reseed from dumps.js"
          >
            {{ isLoading ? 'Running...' : 'Reset DB to Seed' }}
          </button>

          <button
            :disabled="isLoading"
            class="px-4 py-2 rounded-lg text-sm font-medium text-black bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 transition-colors duration-200"
            @click="softResetDatabase"
            title="Drop all tables via SQL and re-initialize"
          >
            {{ isLoading ? 'Running...' : 'Soft Reset (drop schema)' }}
          </button>
        </div>
      </div>

      <div
        v-if="error || queryError"
        class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800"
      >
        {{ error?.message || queryError }}
      </div>

      <div v-if="queryResult.length" class="space-y-2">
        <h3 class="text-lg font-semibold text-black-900">Results:</h3>
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  v-for="column in Object.keys(queryResult[0])"
                  :key="column"
                  class="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700"
                >
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(row, index) in queryResult"
                :key="index"
                class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
              >
                <td
                  v-for="column in Object.keys(row)"
                  :key="column"
                  class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-300"
                >
                  {{ row[column] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-sm text-black">No rows yet — run a query to see results.</div>
    </div>
  </div>
</template>
