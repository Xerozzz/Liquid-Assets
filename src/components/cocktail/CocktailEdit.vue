<script>
import { getCocktailById } from '@/api/cocktail'
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
import InputText from 'primevue/inputtext'
import { Button } from 'primevue'

export default {
  data() {
    return {
      value: "test",
      cocktail: {},
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
    async getData() {
      try {
        this.cocktail = await getCocktailById(this.$route.params.id)
      } catch (error) {
        console.log(error)
      }
    },
    submitForm() {
      // Handle form submission logic here
      alert(`Submitted: ${this.form.name}, ${this.form.email}, ${this.form.message}`)
    },
  },
  mounted() {
    this.getData()
  },
}
</script>

<template>
  <!-- {{this.cocktail.recipe_id}} -->
  <InputText type="text" v-model="value"/>
</template>
