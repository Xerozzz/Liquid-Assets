<script>
import { getCocktail } from '@/api/cocktail.js'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'CocktailView',
  setup() {
    const notification = useNotificationStore()
    const { destroy  } = useSQLite()
    return { notification, destroy  }
  },
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
      this.queryResult = await getCocktail()
      this.loading = false
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
  <div v-if="loading" class="text-center">
    <p>Loading...</p>
  </div>
  <div class="bodysection" v-else>
    <button class="nav_button" @click="$router.push('/')">Back</button>
    <button class="nav_button" @click="$router.push('/cocktail/create')">Create Cocktail</button>
    <h1 class="title">Cocktails</h1>
    <div class="grid grid-cols-5 justify-center gap-8">
      <div
        class="border-1 rounded-md text-center pt-1"
        v-for="cocktail in queryResult"
        :key="cocktail.recipe_id"
      >
        <router-link :to="`/cocktail/view/${cocktail.recipe_id}`" class="font-bold text-md">{{
          cocktail.name
        }}</router-link>
        <br />
        <router-link :to="`/cocktail/view/${cocktail.recipe_id}`">
          <img
            v-bind:src="cocktail.image"
            :alt="'Image of ' + cocktail.name"
            v-if="cocktail.image"
          />
        </router-link>
      </div>
    </div>
  </div>
</template>
