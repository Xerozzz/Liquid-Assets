import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm'
import { ref } from 'vue'
import { databaseConfig } from '@/config/database'

const isInitialized = ref(false)

export function useSQLite() {
  const isLoading = ref(false)
  const error = ref(null)
  let promiser = null
  let dbId = null

  // eslint-disable-next-line no-console
  const log = (...args) => console.log(...args)

  const initializePromiser = async () => {
    return new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser),
      })
    })
  }

  const setIsInitialized = () => {
    isInitialized.value = false;
  }

  const openDatabase = async (p) => {
    const response = await p('open', { filename: databaseConfig.filename })
    if (response.type === 'error')
      throw new Error(response.result.message)
    return response.result.dbId
  }

  const initialize = async () => {
    if (isInitialized.value)
      return true

    isLoading.value = true
    error.value = null

    try {
      log('Initializing SQLite database...')
      promiser = await initializePromiser()
      if (!promiser)
        throw new Error('Failed to initialize promiser')

      await promiser('config-get', {})
      dbId = await openDatabase(promiser)
      log('Database opened successfully with ID:', dbId)

      // sqllite before v4 will not enforce foreign key constraints, so it needs to be manually set on whenever the database initialise
      await promiser('exec', {
        dbId,
        sql: 'PRAGMA foreign_keys = ON;'
      })

      for (const tableKey of Object.keys(databaseConfig.tables)) {
        const table = databaseConfig.tables[tableKey];
        await promiser('exec', {
          dbId,
          sql: table.schema,
        })
      }


      isInitialized.value = true
      return true
    }
    catch (err) {
      console.log(err);

      error.value = err instanceof Error
        ? `Failed to initialize SQLite database: ${err.message}`
        : 'Failed to initialize SQLite database'
      throw error.value
    }
    finally {
      isLoading.value = false
    }
  }

  const executeQuery = async (sql, params = []) => {
    if (!dbId || !promiser)
      await initialize()

    isLoading.value = true
    error.value = null

    try {
      log('Executing query:', sql, 'with params:', params)
      const result = await promiser('exec', {
        dbId: dbId,
        sql,
        bind: params,
        rowMode: 'object',
        returnValue: 'resultRows',
      })
      log('Query result:', result)

      if (result.type === 'error')
        throw new Error(result.result.message)

      return result
    }
    catch (err) {
      console.log(err);

      error.value = err instanceof Error
        ? `Query execution failed: ${err.message}`
        : 'Query execution failed'
      throw error.value
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    isInitialized,
    executeQuery,
    initialize,
    setIsInitialized
  }
}
