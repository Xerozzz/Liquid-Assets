<script>
import { getCocktailById, updateCocktail } from '@/api/cocktail'
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
import {
  getRecipeIngredientByRecipeId,
  createMultipleRecipeIngredient,
} from '@/api/recipe_ingredient'
import {
  getRecipeHmIngredientByRecipeId,
  createMultipleRecipeHmIngredient,
} from '@/api/recipe_hm_ingredient'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  components: {
    IngredientDatatable,
  },
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      isLoading: true,
      cocktailId: 0,
      cocktail: {},
      ingredients: [],
      hm_ingredients: [],
      cocktailIngredients: [],
      cocktailHmIngredients: [],
      glassware: [],
      initialValues: {
        name: '',
        glass: '',
        step_to_make: '',
        garnish: '',
        notes: '',
        image: '',
      },
    }
  },
  methods: {
    async getData() {
      try {
        await this.getIngredientData()
        await this.getGlasswareData()
        await this.getHmIngredientData()
        await this.getCocktailData()
        await this.getCocktailHmIngredient()
        await this.getCocktailIngredient()
      } finally {
        this.isLoading = false
      }
    },

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
        this.glassware = await getGlassware()
      } catch (error) {
        console.log(error)
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    async getCocktailIngredient() {
      try {
        let ingredients = await getRecipeIngredientByRecipeId(this.cocktailId)
        if (ingredients != undefined && ingredients.length != 0) {
          this.cocktailIngredients = ingredients.map((ingredient) => ({
            ...ingredient,
            selected_quantity: ingredient.quantity,
          }))
        }
      } catch (error) {
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    async getCocktailHmIngredient() {
      try {
        let hmIngredients = await getRecipeHmIngredientByRecipeId(this.cocktailId)
        console.log(hmIngredients)

        if (hmIngredients != undefined && hmIngredients.length != 0) {
          this.cocktailHmIngredients = hmIngredients.map((ingredient) => ({
            ...ingredient,
            selected_quantity: ingredient.quantity,
          }))
        }
      } catch (error) {
        this.notification.notify({
          message: `${error}`,
          summary: 'Error',
          severity: 'error',
        })
      }
    },
    async getCocktailData() {
      try {
        let data = await getCocktailById(this.$route.params.id)
        if (data.length == 0) {
          this.notification.notify({
            message: 'Cocktail not found',
            summary: 'Error',
            severity: 'error',
          })
          this.$router.replace('/cocktail')
        } else {
          this.cocktail = data[0]
          this.initialValues = {
            name: this.cocktail.recipe_name,
            glass: this.cocktail.glass_id,
            step_to_make: this.cocktail.step_to_make,
            garnish: this.cocktail.garnish,
            notes: this.cocktail.notes,
            image: this.cocktail.image,
          }
        }
      } catch (error) {
        console.log(error)
      }
    },

    async insertIngredientData(rows) {
      try {
        let result = await createMultipleRecipeIngredient(rows)
        this.destroy()
        return result
      } catch (error) {
        console.log(error)
      }
    },

    async insertHmIngredientData(rows) {
      try {
        let result = await createMultipleRecipeHmIngredient(rows)
        this.destroy()
        return result
      } catch (error) {
        console.log(error)
      }
    },
    handleRecipeIngredients(data) {
      this.cocktailIngredients = data
    },
    handleHmRecipeIngredients(data) {
      this.cocktailHmIngredients = data
    },

    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()

      reader.onload = async (e) => {
        this.initialValues.image = e.target.result
      }

      reader.readAsDataURL(file)
    },

    /** This is for validating form data */
    resolver: ({ values }) => {
      const errors = {}
      console.log(values)

      if (!values.name) {
        errors.name = [{ message: 'Name is required.' }]
      }

      if (!values.glass) {
        errors.glass = [{ message: 'Glass is required.' }]
      }

      if (!values.step_to_make) {
        errors.step_to_make = [{ message: 'Steps to make is required' }]
      }

      return {
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    async onFormSubmit({ valid, values }) {
      // console.log(values)

      try {
        if (this.cocktailIngredients.length === 0 && this.cocktailHmIngredients.length === 0) {
          valid = false
          this.notification.notify({
            message: `Cocktail cannot be made without any ingredients.`,
            summary: 'No ingredients added',
            severity: 'error',
          })
        }
        if (valid) {
          await updateCocktail(
            values.name,
            values.glass,
            values.step_to_make,
            values.garnish,
            values.notes,
            this.cocktailId,
            // this.initialValues.image,
          )

          let cocktailIngredients = this.cocktailIngredients.map(
            ({ ingredient_id, selected_quantity }) => ({
              recipe_id: this.cocktailId,
              ingredient_id,
              selected_quantity,
            }),
          )
          await this.insertIngredientData(cocktailIngredients)

          let cocktailHmIngredients = this.cocktailHmIngredients.map(
            ({ hm_ingredient_id, selected_quantity }) => ({
              recipe_id: this.cocktailId,
              hm_ingredient_id,
              selected_quantity,
            }),
          )

          let result = await this.insertHmIngredientData(cocktailHmIngredients)
          console.log(result)

          this.$router.push('/cocktail')
        }
      } catch (error) {
        console.log(error)
      }
    },
  },
  mounted() {
    this.cocktailId = this.$route.params.id
    this.getData()
  },
  unmounted() {
    this.isLoading = true
  },
}
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center py-20">
    <ProgressSpinner />
  </div>
  <div v-else>
    <img
      class="w-80 h-auto"
      v-bind:src="cocktail.image"
      alt="Cocktail Image"
      v-if="cocktail.image"
    />
    <Form
      v-slot="$form"
      :initialValues
      :resolver
      @submit="onFormSubmit"
      @keydown.enter="
        ($event) => {
          if ($event.target.tagName !== 'TEXTAREA') $event.preventDefault()
        }
      "
      class="space-y-8 max-w-7xl mx-auto m-5"
    >
      <!-- Name input -->
      <div>
        <InputText
          name="name"
          type="text"
          placeholder="Name"
          fluid
          class="w-full rounded-md border border-gray-300 p-2"
        />
        <Message
          v-if="$form.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1 text-red-600"
        >
          {{ $form.name.error?.message }}
        </Message>
      </div>

      <!-- Glass Select -->
      <div>
        <Select
          name="glass"
          :options="glassware"
          optionLabel="name"
          optionValue="glass_id"
          placeholder="Select Glass"
          fluid
          class="w-full rounded-md border border-gray-300"
        />
        <Message
          v-if="$form.glass?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1 text-red-600"
        >
          {{ $form.glass.error?.message }}
        </Message>
      </div>

      <!-- Steps to Make textarea -->
      <div>
        <Textarea
          name="step_to_make"
          placeholder="Steps to Make"
          rows="10"
          fluid
          class="w-full rounded-md border border-gray-300 p-2 resize-y"
        />
        <Message
          v-if="$form.step_to_make?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1 text-red-600"
        >
          {{ $form.step_to_make.error?.message }}
        </Message>
      </div>

      <!-- Garnish input -->
      <div>
        <InputText
          name="garnish"
          type="text"
          placeholder="Garnish (Optional)"
          fluid
          class="w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      <!-- Notes textarea -->
      <div>
        <Textarea
          name="notes"
          placeholder="Notes (Optional)"
          rows="2"
          fluid
          class="w-full rounded-md border border-gray-300 p-2 resize-y"
        />
      </div>

      <IngredientDatatable
        title="Ingredients"
        :ingredients="ingredients"
        :selectedIngredients="cocktailIngredients"
        @selectedIngredients="handleRecipeIngredients"
      />

      <IngredientDatatable
        title="Homemade Ingredients"
        :ingredients="hm_ingredients"
        :selectedIngredients="cocktailHmIngredients"
        @selectedIngredients="handleHmRecipeIngredients"
      />

      <!-- Submit button -->
      <div class="flex justify-center">
        <Button type="submit" severity="secondary" label="Submit" class="w-48" />
      </div>
    </Form>
  </div>
</template>
