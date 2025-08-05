<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import ProgressSpinner from "primevue/progressspinner";

export default {
  setup() {
    const notification = useNotificationStore()
    const { destory } = useSQLite()
    return { notification, destory }
  },
  data() {
    return {
      ingredients: {},
      hm_ingredients: {},
      glassware: {},
      form: {
        name: '',
        email: '',
        message: '',
      },
    }
  },
  methods: {
    /** For some reason stacking the queries in 1 function call will cause sqllite to complain
     * and crash as it cannot handle multiple queries at once. Instead it needs to be seperated into
     * its own functions so things may look a little ugly here.
     */
    async getIngredientData() {
      try {
        this.ingredients = await getIngredients()
      } catch (error) {
        console.log(error)
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    async getHmIngredientData() {
      try {
        this.hm_ingredients = await getHmIngredient()
      } catch (error) {
        console.log(error)
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    async getGlasswareData() {
      try {
        this.getGlassware = await getGlassware()
      } catch (error) {
        console.log(error)
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
  },
  mounted() {
    this.getIngredientData()
    this.getHmIngredientData()
    this.getGlasswareData()
    this.notification.notify({
      message: `test`,
      summary: 'Test',
    })
  },
  unmounted() {
    this.destory()
  },
}
</script>

<template>
  <h1>create</h1>
          <ProgressSpinner
          style="width: 50px; height: 50px"
          fill="transparent"
          animationDuration=".5s"
          aria-label="Custom ProgressSpinner"
        />
</template>
