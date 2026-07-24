<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
import { createCocktail } from '@/api/cocktail'
import { createMultipleRecipeIngredient } from '@/api/recipe_ingredient'
import { createMultipleRecipeHmIngredient } from '@/api/recipe_hm_ingredient'

import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  name: 'CocktailCreate',
  components: {
    IngredientDatatable,
  },
  setup() {
    const notification = useNotificationStore()
    const { saveImage } = useImageStorage()
    return { notification, saveImage }
  },
  data() {
    return {
      ingredients: [],
      hm_ingredients: [],
      glassware: [],
      recipe_ingredients: [],
      recipe_hm_ingredients: [],
      selectedFileRaw: null,
      initialValues: {
        name: '',
        glass: '',
        step_to_make: '',
        garnish: '',
        notes: '',
        image: '',
        sale_price: null,
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
        console.error(error)
      }
    },
    async getHmIngredientData() {
      try {
        this.hm_ingredients = await getHmIngredient()
      } catch (error) {
        console.error(error)
      }
    },
    async getGlasswareData() {
      try {
        this.glassware = await getGlassware()
      } catch (error) {
        console.error(error)
      }
    },

    resolver: ({ values }) => {
      const errors = {}
      if (!values.name) errors.name = [{ message: 'Name is required.' }]
      if (!values.glass) errors.glass = [{ message: 'Glass is required.' }]
      if (!values.step_to_make) errors.step_to_make = [{ message: 'Steps to make is required' }]
      return { values, errors }
    },

    handleRecipeIngredients(data) {
      this.recipe_ingredients = data
    },
    handleHmRecipeIngredients(data) {
      this.recipe_hm_ingredients = data
    },

    onFileSelect(event) {
      const file = event.files[0]
      this.selectedFileRaw = file

      this.initialValues.image = URL.createObjectURL(file)
    },

    async insertIngredientData(rows) {
      return await createMultipleRecipeIngredient(rows)
    },
    async insertHmIngredientData(rows) {
      return await createMultipleRecipeHmIngredient(rows)
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
          let finalImageFilename = ''

          if (this.selectedFileRaw) {
            console.log('Saving image to storage...')
            finalImageFilename = await this.saveImage(this.selectedFileRaw)
            console.log('Saved as:', finalImageFilename)
          }

          const createdRecipe = await createCocktail(
            values.name,
            values.glass.glass_id,
            values.step_to_make,
            values.garnish,
            values.notes,
            finalImageFilename,
            values.sale_price,
          )
          const recipe_id = createdRecipe?.recipe_id

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
      class="space-y-6 bg-white p-8 rounded-lg shadow-md border border-primary-100"
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
          <label class="font-semibold">Sale Price (Optional)</label>
          <InputNumber
            name="sale_price"
            placeholder="0.00"
            mode="currency"
            currency="USD"
            locale="en-US"
            fluid
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Image</label>
          <FileUpload
            mode="basic"
            name="image"
            accept="image/*"
            :maxFileSize="5000000"
            :auto="true"
            customUpload
            @select="onFileSelect"
            chooseLabel="Upload Image"
            class="w-full"
          />
          <div v-if="initialValues.image" class="mt-2 text-center">
            <img :src="initialValues.image" class="h-32 object-contain mx-auto rounded border" />
            <small class="text-green-600 block">Image selected</small>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold">Steps to Make</label>
        <Textarea
          style="white-space: pre"
          name="step_to_make"
          placeholder="Add ingredients to mixing glass with ice...&#10;Stir until chilled...&#10;Strain over rock."
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
