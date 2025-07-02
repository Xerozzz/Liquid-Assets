<script setup lang="ts">
import { useSQLite } from '@/composables/useSQLite'
import { ref } from 'vue'

const { isLoading, error, executeQuery } = useSQLite()
const sqlQuery = ref('SELECT * FROM test_table')
const queryResult = ref<any[]>([])
const queryError = ref<string | null>(null)

const exampleQueries = [
  { title: 'Select all', query: 'SELECT * FROM test_table' },
  { title: 'Insert', query: 'INSERT INTO test_table (name) VALUES (\'New Test Item\')' },
  { title: 'Update', query: 'UPDATE test_table SET name = \'Updated Item\' WHERE name LIKE \'New%\'' },
  { title: 'Delete', query: 'DELETE FROM test_table WHERE name = \'Updated Item\'' },
  { title: 'Sort', query: 'SELECT * FROM test_table ORDER BY created_at DESC' },
  { title: 'Filter', query: 'SELECT * FROM test_table WHERE created_at > date(\'now\', \'-1 day\')' },
]

async function runQuery() {
  queryError.value = null
  queryResult.value = []

  try {
    const result = await executeQuery(sqlQuery.value)
    const isSelect = sqlQuery.value.trim().toLowerCase().startsWith('select')

    if (isSelect) {
      queryResult.value = result?.result.resultRows || []
    }
    else {
      queryResult.value = (await executeQuery('SELECT * FROM test_table'))?.result.resultRows || []
    }
  }
  catch (err) {
    queryError.value = err instanceof Error ? err.message : 'An error occurred'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
      SQLite Playground
    </h2>

    <div class="mt-4 space-y-2">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Example Queries:
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="example in exampleQueries"
          :key="example.title"
          class="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800
            dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
          @click="sqlQuery = example.query"
        >
          {{ example.title }}
        </button>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        The test_table has columns:<br>
        - id (INTEGER PRIMARY KEY AUTOINCREMENT)<br>
        - name (TEXT NOT NULL)<br>
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
          class="w-full px-4 py-3 rounded-lg font-mono text-sm bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100
            transition-colors duration-200"
        />
        <button
          :disabled="isLoading"
          class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600
            hover:bg-primary-700 disabled:bg-gray-400 transition-colors duration-200"
          @click="runQuery"
        >
          {{ isLoading ? 'Running...' : 'Run Query' }}
        </button>
      </div>

      <div
        v-if="error || queryError"
        class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600
          border border-red-200 dark:border-red-800"
      >
        {{ error?.message || queryError }}
      </div>

      <div v-if="queryResult.length" class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Results:
        </h3>
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  v-for="column in Object.keys(queryResult[0])"
                  :key="column"
                  class="px-4 py-3 text-left text-sm font-medium text-gray-900
                    dark:text-gray-200 border-b border-gray-200"
                >
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="(row, index) in queryResult"
                :key="index"
                class="bg-white dark:bg-gray-900 hover:bg-gray-50 transition-colors duration-150"
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
    </div>
  </div>
</template>
