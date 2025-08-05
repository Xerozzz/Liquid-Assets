<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import { Form } from '@primevue/forms'

import FileUpload from 'primevue/fileupload'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Card from 'primevue/card'
import AutoComplete from 'primevue/autocomplete'
import DataTable from 'primevue/datatable'

export default {
  setup() {
    const notification = useNotificationStore()
    const { destory } = useSQLite()
    return { notification, destory }
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
    /** For some reason stacking the queries in 1 function call will cause sqllite to complain
     * and crash as it cannot handle multiple queries at once. Instead it needs to be seperated into
     * its own functions so things may look a little ugly here.
     */
    async getIngredientData() {
      try {
        this.ingredients = await getIngredients()
        this.filtered_ingredients = this.ingredients
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
        console.log(this.hm_ingredients)
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

    onIngredientOptionClick(event) {
      const exists = this.recipe_ingredients.some(
        (item) => item.ingredient_id === event.value.ingredient_id,
      )

      if (!exists) {
        this.recipe_ingredients.push({ selected_quantity: 0, ...event.value })
        console.log(this.recipe_ingredient)
      } else {
        console.log('Ingredient already exists in the list.')
      }

      this.ingredientInput = ''
    },

    onHmIngredientOptionClick(event) {
      const exists = this.recipe_hm_ingredients.some(
        (item) => item.hm_ingredient_id === event.value.hm_ingredient_id,
      )

      if (!exists) {
        this.recipe_hm_ingredients.push({ selected_quantity: 0, ...event.value })
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

    onFormSubmit({ valid, values }) {
      console.log(values)
      console.log(this.initialValues.image);
      
      if (valid) {
        this.notification.notify({
          message: `Form is submitted`,
          summary: 'Form is submitted',
          severity: 'success',
        })
      }
    },
  },
  mounted() {
    this.getIngredientData()
    this.getHmIngredientData()
    this.getGlasswareData()
  },
  unmounted() {
    this.destory()
  },
}
</script>

<template>
  <Form v-slot="$form" :initialValues :resolver @submit="onFormSubmit" class="">
    <div class="flex mt-5">
      <div class="w-32 flex-1">
        <Textarea name="step_to_make" placeholder="Steps to Make" rows="10" fluid />
        <Message v-if="$form.step_to_make?.invalid" severity="error" size="small" variant="simple">
          {{ $form.step_to_make.error?.message }}
        </Message>
      </div>
      <div class="w-14 flex-1">
        <div class="flex flex-col gap-2">
          <InputText name="name" type="text" placeholder="Name" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
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

        <div class="flex flex-col gap-1">
          <InputText name="garnish" type="text" placeholder="Garnish (Optional)" fluid />
          <Message v-if="$form.garnish?.invalid" severity="error" size="small" variant="simple">
            {{ $form.garnish.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <Textarea name="notes" placeholder="Notes (Optional)" rows="2" fluid />
          <Message v-if="$form.notes?.invalid" severity="error" size="small" variant="simple">
            {{ $form.notes.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <FileUpload
            name="image"
            @select="onFileSelect"
            :showUploadButton="false"
            :showCancelButton="false"
            :multiple="false"
            :fileLimit="1"
            accept="image/*"
            :maxFileSize="1000000"
          >
            <template #empty>
              <span>Drag and drop files to here to upload.</span>
            </template>
          </FileUpload>

          <Message v-if="$form.image?.invalid" severity="error" size="small" variant="simple">
            {{ $form.image.error?.message }}
          </Message>
        </div>
      </div>
    </div>
    <div class="w-full">
      <div class="flex justify-center items-center">
        <Card class="w-full">
          <template #title>Ingredients</template>
          <template #subtitle>
            <div class="w-full">
              <AutoComplete
                v-model="ingredientInput"
                :suggestions="filtered_ingredients"
                optionLabel="name"
                @complete="searchIngredients"
                @option-select="onIngredientOptionClick"
              />
            </div>
          </template>
          <template #content>
            <div v-if="recipe_ingredients.length !== 0">
              <DataTable
                :value="recipe_ingredients"
                tableStyle="min-width: 50rem; cursor: default;"
              >
                <Column field="name" header="Name"></Column>
                <Column field="selected_quantity" header="Quantity">
                  <template #body="slotProps">
                    <InputText
                      v-model="slotProps.data.selected_quantity"
                      id="selected_quantity"
                      class="w-full"
                    />
                  </template>
                </Column>
                <Column field="is_deleted" header="Delete">
                  <template #body="slotProps">
                    <button @click="onDeleteIngredient(slotProps.data.ingredient_id)">
                      Remove
                    </button>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else>
              <h1>No ingredient added</h1>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <div class="w-full">
      <div class="flex justify-center items-center">
        <Card class="w-full">
          <template #title>Homemade Ingredients</template>
          <template #subtitle>
            <div class="w-full">
              <AutoComplete
                v-model="hmIngredientInput"
                :suggestions="filtered_hm_ingredients"
                optionLabel="name"
                @complete="searchHMIngredients"
                @option-select="onHmIngredientOptionClick"
              />
            </div>
          </template>
          <template #content>
            <div v-if="recipe_hm_ingredients.length !== 0">
              <DataTable
                :value="recipe_hm_ingredients"
                tableStyle="min-width: 50rem; cursor: default;"
              >
                <Column field="name" header="Name"></Column>
                <Column field="selected_quantity" header="Quantity">
                  <template #body="slotProps">
                    <InputText
                      v-model="slotProps.data.selected_quantity"
                      id="selected_quantity"
                      class="w-full"
                    />
                  </template>
                </Column>
                <Column field="is_deleted" header="Delete">
                  <template #body="slotProps">
                    <button @click="onDeleteHmIngredient(slotProps.data.hm_ingredient_id)">
                      Remove
                    </button>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else>
              <h1>No homemade ingredient added</h1>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <Button type="submit" severity="secondary" label="Submit" />
  </Form>
</template>
