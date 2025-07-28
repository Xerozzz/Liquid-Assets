<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
export default {
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
      }
    },
    async getHmIngredientData() {
      try {
        this.hm_ingredients = await getHmIngredient()
      } catch (error) {
        console.log(error)
      }
    },
    async getGlasswareData() {
      try {
        this.getGlassware = await getGlassware()
      } catch (error) {
        console.log(error)
      }
    },
  },
  mounted() {
    this.getIngredientData()
    this.getHmIngredientData()
    this.getGlasswareData()
  },
}
</script>

<template></template>
