<script>
import { useSQLite } from '@/composables/useSQLite'
import router from '@/router'
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
    <router-link to="/"><- Back</router-link>
    <h1>Cocktails</h1>
    <button @click="$router.push('/cocktail/create')">Create Cocktail</button>
    <div class="grid-container">
      <div class="cocktails" v-for="cocktail in queryResult" :key="cocktail.recipe_id">
        <div class="image"><br />{{ cocktail.image }}</div>
        <router-link :to="`/cocktail/view/${cocktail.recipe_id}`">{{ cocktail.name }}</router-link>
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
