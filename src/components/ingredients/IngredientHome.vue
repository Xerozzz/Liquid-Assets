<script>
import { getIngredients } from '@/api/ingredients.js'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'IngredientView',
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
    }
  },
  methods: {
    async retrieveIngredients() {
      this.loading = true
      this.queryResult = await getIngredients()
      this.loading = false
    },
  },
  mounted() {
    this.retrieveIngredients()
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
    <button class="nav_button" @click="$router.push('/ingredient/create')">
      Create Ingredient
    </button>
    <h1 class="title">Ingredients</h1>
    <div class="grid grid-cols-5 justify-center gap-8">
      <div
        class="border-1 rounded-md text-center pt-1"
        v-for="ingredient in queryResult"
        :key="ingredient.ingredient_id"
      >
        <router-link
          :to="`/ingredient/view/${ingredient.ingredient_id}`"
          class="font-bold text-md"
          >{{ ingredient.name }}</router-link
        >
      </div>
    </div>
  </div>
</template>
