<script>
import { useSQLite } from '@/composables/useSQLite'
const { executeQuery } = useSQLite()

export default {
  name: 'CocktailView',
  data() {
    return {
      loading: true,
      sqlQuery: 'SELECT * FROM recipe',
      sqlTable: 'test_table',
      queryResult: [],
      queryError: null,
    }
  },
  methods: {
    async retrieveCocktails() {
      this.loading = true
      const result = await executeQuery(this.sqlQuery)
      this.queryResult = result?.result.resultRows || []
      this.loading = false
    },
  },
  mounted() {
    this.retrieveCocktails()
  },
}
</script>

<template>
  <div v-if="loading" class="text-center">
    <p>Loading...</p>
  </div>
  <div v-else>
    <h1>Cocktails</h1>
    <ol>
      <li v-for="cocktail in queryResult" :key="cocktail.recipe_id">
        {{ cocktail.name }}
      </li>
    </ol>
  </div>
</template>
