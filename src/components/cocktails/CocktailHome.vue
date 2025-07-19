<script>
import { useSQLite } from '@/composables/useSQLite'
const { executeQuery } = useSQLite()

export default {
  name: 'CocktailView',
  data() {
    return {
      loading: true,
      sqlQuery: 'SELECT * FROM recipe',
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
    <a href="/"><- Back</a>
    <h1>Cocktails</h1>
    <div class="grid-container">
      <div class="cocktails" v-for="cocktail in queryResult" :key="cocktail.recipe_id">
        <div class="image"><br />{{ cocktail.image }}</div>
        {{ cocktail.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cocktails {
  display: flex;
  flex-direction: row;
  margin: 10px;
  border: 1px solid black;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
</style>
