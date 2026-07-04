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

import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  name: 'CocktailEdit',
  components: {
    IngredientDatatable,
  },
  setup() {
    const notification = useNotificationStore()
    const { saveImage, getImageUrl } = useImageStorage()
    return { notification, saveImage, getImageUrl }
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
      selectedFileRaw: null,
      previewImageUrl: null,
      resolvedImageUrl: null,
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
    // ... [KEEPING EXISTING DATA METHODS SAME AS BEFORE] ...
    async getIngredientData() {
      this.ingredients = await getIngredients()
    },
    async getHmIngredientData() {
      this.hm_ingredients = await getHmIngredient()
    },
    async getGlasswareData() {
      this.glassware = await getGlassware()
    },
    async getCocktailIngredient() {
      let ingredients = await getRecipeIngredientByRecipeId(this.cocktailId)
      if (ingredients && ingredients.length != 0) {
        this.cocktailIngredients = ingredients.map((ingredient) => ({
          ...ingredient,
          selected_quantity: ingredient.quantity,
        }))
      }
    },
    async getCocktailHmIngredient() {
      let hmIngredients = await getRecipeHmIngredientByRecipeId(this.cocktailId)
      if (hmIngredients && hmIngredients.length != 0) {
        this.cocktailHmIngredients = hmIngredients.map((ingredient) => ({
          ...ingredient,
          selected_quantity: ingredient.quantity,
        }))
      }
    },
    async getCocktailData() {
      let data = await getCocktailById(this.$route.params.id)
      if (data.length == 0) {
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
    },

    async insertIngredientData(rows) {
      let result = await createMultipleRecipeIngredient(rows)
      return result
    },

    async insertHmIngredientData(rows) {
      let result = await createMultipleRecipeHmIngredient(rows)
      return result
    },
    handleRecipeIngredients(data) {
      this.cocktailIngredients = data
    },
    handleHmRecipeIngredients(data) {
      this.cocktailHmIngredients = data
    },

    onFileSelect(event) {
      const file = event.files[0]
      this.selectedFileRaw = file
      this.previewImageUrl = URL.createObjectURL(file)
    },

    resolver: ({ values }) => {
      const errors = {}
      if (!values.name) errors.name = [{ message: 'Name is required.' }]
      if (!values.glass) errors.glass = [{ message: 'Glass is required.' }]
      if (!values.step_to_make) errors.step_to_make = [{ message: 'Steps to make is required' }]
      return { values, errors }
    },

    async onFormSubmit({ valid, values }) {
      try {
        if (this.cocktailIngredients.length === 0 && this.cocktailHmIngredients.length === 0) {
          valid = false
          this.notification.notify({
            message: `Cocktail cannot be made without any ingredients.`,
            summary: 'No ingredients',
            severity: 'error',
          })
        }
        if (valid) {
          let imageValue = this.initialValues.image
          if (this.selectedFileRaw) {
            imageValue = await this.saveImage(this.selectedFileRaw)
          }

          await updateCocktail(
            values.name,
            values.glass,
            values.step_to_make,
            values.garnish,
            values.notes,
            imageValue,
            this.cocktailId,
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
          await this.insertHmIngredientData(cocktailHmIngredients)

          this.notification.notify({
            message: `Cocktail updated successfully`,
            summary: 'Success',
            severity: 'success',
          })
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
  computed: {
    displayImageUrl() {
      return this.previewImageUrl || this.resolvedImageUrl
    },
  },
  watch: {
    'initialValues.image': {
      immediate: true,
      async handler(val) {
        if (!val) {
          this.resolvedImageUrl = null
          return
        }
        this.resolvedImageUrl = await this.getImageUrl(val)
      },
    },
  },
}
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="max-w-5xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Edit Cocktail</h1>

    <div v-if="displayImageUrl" class="flex justify-center mb-6">
      <img
        :src="displayImageUrl"
        alt="Cocktail Image"
        class="h-48 rounded-md shadow-sm object-cover"
      />
    </div>

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
          <InputText name="name" placeholder="Name" fluid />
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
            optionValue="glass_id"
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
          <InputText name="garnish" placeholder="Garnish" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Update Image</label>
          <FileUpload
            mode="basic"
            name="image"
            accept="image/*"
            :maxFileSize="1000000"
            :auto="true"
            customUpload
            @select="onFileSelect"
            chooseLabel="Change Image"
            class="w-full"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold">Steps to Make</label>
        <Textarea
          style="white-space: pre-wrap"
          name="step_to_make"
          placeholder="Steps..."
          rows="6"
          fluid
          class="resize-y"
        />
        <Message v-if="$form.step_to_make?.invalid" severity="error" size="small" variant="simple">
          {{ $form.step_to_make.error?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold">Notes</label>
        <Textarea name="notes" placeholder="Notes..." rows="3" fluid class="resize-y" />
      </div>

      <hr class="border-gray-200" />

      <div class="space-y-6">
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
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/cocktail')" />
        <Button type="submit" label="Save Changes" class="w-48" />
      </div>
    </Form>
  </div>
</template>
