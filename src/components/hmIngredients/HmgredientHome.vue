<script>
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'
import { getHmIngredient } from '@/api/hm_ingredients.js'

export default {
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
    async getData() {
      this.loading = true
      this.queryResult = await getHmIngredient()
      this.loading = false
    },
  },
  mounted() {
    this.getData()
  },
}
</script>

<template>
  <div v-if="loading" class="text-center">
    <p>Loading...</p>
  </div>
  <div class="bodysection" v-else>
    <button class="nav_button" @click="$router.push('/')">Back</button>
    <button class="nav_button" @click="$router.push('/hm/create')">Create Hm ingredient</button>
    <h1 class="title">Hm Ingredients</h1>
    <div class="grid grid-cols-5 justify-center gap-8">
      <div
        class="border-1 rounded-md text-center pt-1"
        v-for="hmIngredient in queryResult"
        :key="hmIngredient.hm_ingredient_id"
      >
        <router-link :to="`/hm/view/${hmIngredient.hm_ingredient_id}`" class="font-bold text-md">{{
          hmIngredient.name
        }}</router-link>
        <br />
        <router-link :to="`/hm/view/${hmIngredient.hm_ingredient_id}`">
          <img
            v-bind:src="hmIngredient.image"
            :alt="'Image of ' + hmIngredient.name"
            v-if="hmIngredient.image"
          />
        </router-link>
      </div>
    </div>
  </div>
</template>
