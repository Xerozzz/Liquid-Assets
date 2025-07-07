<script>
import { getCocktailById } from '@/api/cocktail'
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'

export default {
  data() {
    return {
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

  <form class="max-w-md mx-auto p-6 bg-white rounded shadow">
    <div class="mb-4">
      <label class="block text-gray-700 mb-2" for="name">Name</label>
      <input
        v-model="form.name"
        type="text"
        id="name"
        class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
        placeholder="Enter your name"
      />
    </div>
    <div class="mb-4">
      <label class="block text-gray-700 mb-2" for="email">Email</label>
      <input
        v-model="form.email"
        type="email"
        id="email"
        class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
        placeholder="Enter your email"
      />
    </div>
    <div class="mb-4">
      <label class="block text-gray-700 mb-2" for="message">Message</label>
      <textarea
        v-model="form.message"
        id="message"
        class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
        rows="4"
        placeholder="Type your message"
      ></textarea>
    </div>
    <button
      type="submit"
      @click.prevent="submitForm"
      class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Submit
    </button>
  </form>
</template>
