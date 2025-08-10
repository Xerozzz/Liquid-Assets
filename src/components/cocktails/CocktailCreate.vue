<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'
import { createCocktail } from '@/api/cocktail'
import { createMultipleRecipeIngredient } from '@/api/recipe_ingredient'
import { createMultipleRecipeHmIngredient } from '@/api/recipe_hm_ingredient'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import { Form } from '@primevue/forms'

import FileUpload from 'primevue/fileupload'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Card from 'primevue/card'
import AutoComplete from 'primevue/autocomplete'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'

export default {
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
      filtered_ingredients: [],
      filtered_hm_ingredients: [],
      recipe_ingredients: [],
      recipe_hm_ingredients: [],
      ingredientInput: '',
      hmIngredientInput: '',
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
        this.filtered_ingredients = this.ingredients
        this.destroy()
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
        this.filtered_hm_ingredients = this.hm_ingredients
        this.destroy()
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
        this.destroy()
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
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    /** This is a search function for ingredient with a debounce of 250ms */
    searchIngredients(event) {
      setTimeout(() => {
        if (!event.query.trim().length) {
          this.filtered_ingredients = [...this.ingredients]
        } else {
          this.filtered_ingredients = this.ingredients.filter((ingredient) => {
            return ingredient.name.toLowerCase().startsWith(event.query.toLowerCase())
          })
        }
      }, 250)
    },
    /** This is a search function for homemade ingredient with a debounce of 250ms */
    searchHMIngredients(event) {
      setTimeout(() => {
        if (!event.query.trim().length) {
          this.filtered_hm_ingredients = [...this.hm_ingredients]
        } else {
          this.filtered_hm_ingredients = this.hm_ingredients.filter((ingredient) => {
            return ingredient.name.toLowerCase().startsWith(event.query.toLowerCase())
          })
        }
      }, 250)
    },

    onFileSelect(event) {
      const file = event.files[0]
      const reader = new FileReader()

      reader.onload = async (e) => {
        this.initialValues.image = e.target.result
      }

      reader.readAsDataURL(file)
    },
    /** This is for when the options in the homemade ingredient autocomplete is clicked */
    onIngredientOptionClick(event) {
      const exists = this.recipe_ingredients.some(
        (item) => item.ingredient_id === event.value.ingredient_id,
      )

      if (!exists) {
        this.recipe_ingredients.push({ selected_quantity: 1, ...event.value })
      } else {
        console.log('Ingredient already exists in the list.')
      }

      this.ingredientInput = ''
    },
    /** This is for when the options in the homemade ingredient autocomplete is clicked */
    onHmIngredientOptionClick(event) {
      const exists = this.recipe_hm_ingredients.some(
        (item) => item.hm_ingredient_id === event.value.hm_ingredient_id,
      )

      if (!exists) {
        this.recipe_hm_ingredients.push({ selected_quantity: 1, ...event.value })
        console.log(this.recipe_hm_ingredients)
      } else {
        console.log('Ingredient already exists in the list.')
      }

      this.hmIngredientInput = ''
    },

    onDeleteIngredient(id) {
      this.recipe_ingredients = this.recipe_ingredients.filter((item) => item.ingredient_id !== id)
    },

    onDeleteHmIngredient(id) {
      this.recipe_hm_ingredients = this.recipe_hm_ingredients.filter(
        (item) => item.hm_ingredient_id !== id,
      )
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

    async onFormSubmit({ valid, values, originalEvent }) {
      console.log(originalEvent)

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
          this.destroy()
          if (recipe_id) {
            if (this.recipe_ingredients.length > 0) {
              let ingredients_data = this.recipe_ingredients.map(
                ({ ingredient_id, selected_quantity }) => ({
                  recipe_id,
                  ingredient_id,
                  selected_quantity,
                }),
              )

              let result = await this.insertIngredientData(ingredients_data)
              console.log(result)
            }
            if (this.recipe_hm_ingredients.length > 0) {
              let ingredients_data = this.recipe_hm_ingredients.map(
                ({ hm_ingredient_id, selected_quantity }) => ({
                  recipe_id,
                  hm_ingredient_id,
                  selected_quantity,
                }),
              )

              let result = await this.insertHmIngredientData(ingredients_data)
              console.log(result)
            }
            this.$router.push('/cocktail')
          }
        }
      } catch (error) {
        console.log(error)
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
  <Form
    v-slot="$form"
    :initialValues
    :resolver
    @submit="onFormSubmit"
    @keydown.enter="$event.preventDefault()"
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

    <Card>
      <template #title>Image</template>
      <template #content>
        <!-- Image upload -->
        <div>
          <FileUpload
            v-model="$form.image"
            name="image"
            @select="onFileSelect"
            @uploader=""
            :showUploadButton="false"
            :showCancelButton="false"
            :multiple="false"
            :fileLimit="1"
            accept="image/*"
            :maxFileSize="1000000"
            class="w-full"
            :auto="false"
          >
            <template #empty>
              <span
                class="block p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500 cursor-pointer hover:border-gray-400"
              >
                Drag and drop files here to upload.
              </span>
            </template>
          </FileUpload>
        </div>
      </template>
    </Card>

    <!-- Ingredients Card -->
    <div>
      <Card class="w-full">
        <template #title>Ingredients</template>
        <template #subtitle>
          <AutoComplete
            v-model="ingredientInput"
            :suggestions="filtered_ingredients"
            optionLabel="name"
            @complete="searchIngredients"
            @option-select="onIngredientOptionClick"
            class="w-full"
            placeholder="Search Ingredients"
          />
        </template>
        <template #content>
          <div v-if="recipe_ingredients.length !== 0">
            <DataTable
              :value="recipe_ingredients"
              tableStyle="min-width: 50rem; cursor: default;"
              class="mt-4"
            >
              <Column field="name" header="Name"></Column>
              <Column field="selected_quantity" header="Quantity">
                <template #body="slotProps">
                  <InputNumber
                    v-model="slotProps.data.selected_quantity"
                    id="selected_quantity"
                    :suffix="` ${slotProps.data.unit}`"
                    fluid
                    :min="1"
                    class="w-full"
                  />
                </template>
              </Column>
              <Column field="is_deleted" header="Delete">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    rounded
                    aria-label="Cancel"
                    @click="onDeleteIngredient(slotProps.data.ingredient_id)"
                    class="p-2"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="py-8 text-center text-gray-500 font-semibold" v-else>No ingredient added</div>
        </template>
      </Card>
    </div>

    <!-- Homemade Ingredients Card -->
    <div>
      <Card class="w-full">
        <template #title>Homemade Ingredients</template>
        <template #subtitle>
          <AutoComplete
            v-model="hmIngredientInput"
            :suggestions="filtered_hm_ingredients"
            optionLabel="name"
            @complete="searchHMIngredients"
            @option-select="onHmIngredientOptionClick"
            class="w-full"
            placeholder="Search Homemade Ingredients"
          />
        </template>
        <template #content>
          <div v-if="recipe_hm_ingredients.length !== 0">
            <DataTable
              :value="recipe_hm_ingredients"
              tableStyle="min-width: 50rem; cursor: default;"
              class="mt-4"
            >
              <Column field="name" header="Name"></Column>
              <Column field="selected_quantity" header="Quantity">
                <template #body="slotProps">
                  <InputNumber
                    v-model="slotProps.data.selected_quantity"
                    id="selected_quantity"
                    :suffix="` ${slotProps.data.unit}`"
                    fluid
                    class="w-full"
                  />
                </template>
              </Column>
              <Column field="is_deleted" header="Delete">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    rounded
                    aria-label="Cancel"
                    @click="onDeleteHmIngredient(slotProps.data.hm_ingredient_id)"
                    class="p-2"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="py-8 text-center text-gray-500 font-semibold" v-else>
            No homemade ingredient added
          </div>
        </template>
      </Card>
    </div>

    <!-- Submit button -->
    <div class="flex justify-center">
      <Button type="submit" severity="secondary" label="Submit" class="w-48" />
    </div>
  </Form>
</template>
