<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
import { createCocktail } from '@/api/cocktail'
import { createMultipleRecipeIngredient } from '@/api/recipe_ingredient'
import { createMultipleRecipeHmIngredient } from '@/api/recipe_hm_ingredient'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  name: 'CocktailCreate',
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
      ingredients: [],
      hm_ingredients: [],
      glassware: [],
      recipe_ingredients: [],
      recipe_hm_ingredients: [],
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
      await this.getIngredientData()
      await this.getGlasswareData()
      await this.getHmIngredientData()
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
    /** This is for validating form data */
    resolver: ({ values }) => {
      const errors = {}

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
        values,
        errors,
      }
    },

    handleRecipeIngredients(data) {
      this.recipe_ingredients = data
    },
    handleHmRecipeIngredients(data) {
      this.recipe_hm_ingredients = data
    },
    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()

      reader.onload = async (e) => {
        this.initialValues.image = e.target.result
      }

      reader.readAsDataURL(file)
    },

    async insertIngredientData(rows) {
      try {
        let result = await createMultipleRecipeIngredient(rows)
        // Note: moved destroy() to unmounted or end of parent function to prevent premature closing
        return result
      } catch (error) {
        console.log(error)
      }
    },

    async insertHmIngredientData(rows) {
      try {
        let result = await createMultipleRecipeHmIngredient(rows)
        return result
      } catch (error) {
        console.log(error)
      }
    },

    async onFormSubmit({ valid, values }) {
      try {
        if (this.recipe_ingredients.length === 0 && this.recipe_hm_ingredients.length === 0) {
          valid = false
          this.notification.notify({
            message: `Cocktail cannot be made without any ingredients.`,
            summary: 'No ingredients added',
            severity: 'error',
          })
        }
        if (valid) {
          let recipe_id = await createCocktail(
            values.name,
            values.glass.glass_id,
            values.step_to_make,
            values.garnish,
            values.notes,
            this.initialValues.image,
          )

          if (recipe_id) {
            if (this.recipe_ingredients.length > 0) {
              let ingredients_data = this.recipe_ingredients.map(
                ({ ingredient_id, selected_quantity }) => ({
                  recipe_id,
                  ingredient_id,
                  selected_quantity,
                }),
              )

              await this.insertIngredientData(ingredients_data)
            }
            if (this.recipe_hm_ingredients.length > 0) {
              let ingredients_data = this.recipe_hm_ingredients.map(
                ({ hm_ingredient_id, selected_quantity }) => ({
                  recipe_id,
                  hm_ingredient_id,
                  selected_quantity,
                }),
              )

              await this.insertHmIngredientData(ingredients_data)
            }
            this.destroy()
            this.$router.push('/cocktail')
          }
        }
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
    this.getData()
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Create New Cocktail</h1>

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
      class="space-y-6 bg-white p-8 rounded-lg shadow-md"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Name</label>
          <InputText name="name" placeholder="e.g. Old Fashioned" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Glass</label>
          <Select
            name="glass"
            :options="glassware"
            optionLabel="name"
            placeholder="Select Glass"
            fluid
          />
          <Message v-if="$form.glass?.invalid" severity="error" size="small" variant="simple">
            {{ $form.glass.error?.message }}
          </Message>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Garnish (Optional)</label>
          <InputText name="garnish" placeholder="e.g. Orange Peel" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Image</label>
          <FileUpload
            mode="basic"
            name="image"
            accept="image/*"
            :maxFileSize="1000000"
            :auto="true"
            customUpload
            @select="onFileSelect"
            chooseLabel="Upload Image"
            class="w-full"
          />
          <small v-if="initialValues.image" class="text-green-600">Image selected</small>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold">Steps to Make</label>
        <Textarea
          style="white-space: pre"
          name="step_to_make"
          placeholder="1. Add ingredients..."
          rows="6"
          fluid
          class="resize-y"
        />
        <Message v-if="$form.step_to_make?.invalid" severity="error" size="small" variant="simple">
          {{ $form.step_to_make.error?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold">Notes (Optional)</label>
        <Textarea
          name="notes"
          placeholder="History, flavor profile, etc."
          rows="3"
          fluid
          class="resize-y"
        />
      </div>

      <hr class="border-gray-200" />

      <div class="space-y-6">
        <IngredientDatatable
          title="Ingredients"
          :ingredients="ingredients"
          :selectedIngredients="recipe_ingredients"
          @selectedIngredients="handleRecipeIngredients"
        />

        <IngredientDatatable
          title="Homemade Ingredients"
          :ingredients="hm_ingredients"
          :selectedIngredients="recipe_hm_ingredients"
          @selectedIngredients="handleHmRecipeIngredients"
        />
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/cocktail')" />
        <Button type="submit" label="Create Cocktail" class="w-48" />
      </div>
    </Form>
  </div>
</template>
