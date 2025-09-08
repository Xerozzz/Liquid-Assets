<script>
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import {
  getHmIngredientComponentByHmIngredientId,
  createMultipleHmIngredientComponents,
} from '@/api/hm_ingredient_components'
import { getIngredients } from '@/api/ingredients'
import { getHmIngredientById, updateHmIngredient } from '@/api/hm_ingredients'

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
      hmIngredient: {},
      ingredients: [],
      hmIngredientComponents: [],
      hmIngredientId: null,
      initialValues: {
        name: '',
        cost: 0,
        notes: '',
        unit: '',
        yield: 0,
        image: '',
        is_stocked: 0,
      },
    }
  },
  methods: {
    async getData() {
      try {
        await this.getHmIngredientData()
        await this.getIngredientsData()
        await this.getHmIngredientComponentsData()
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },
    async getIngredientsData() {
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
        let data = await getHmIngredientById(this.$route.params.id)
        if (!data || data.length == 0) {
          this.notification.notify({
            message: 'Homemade ingredient not found',
            summary: 'Error',
            severity: 'error',
          })
          this.$router.replace('/hm')
        } else {
          this.hmIngredient = data
          console.log(data)

          this.initialValues = {
            name: this.hmIngredient.name,
            cost: this.hmIngredient.cost,
            notes: this.hmIngredient.notes,
            unit: this.hmIngredient.unit,
            yield: this.hmIngredient.yield,
            image: this.hmIngredient.image,
            is_stocked: this.hmIngredient.is_stocked === 1 ? true : false,
          }
        }
      } catch (error) {
        console.log(error)
      }
    },
    async getHmIngredientComponentsData() {
      try {
        let hm_ingredient_id = this.$route.params.id
        this.hmIngredientComponents =
          await getHmIngredientComponentByHmIngredientId(hm_ingredient_id)
        console.log(this.hmIngredientComponents)
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    },
    async insertIngredientData(rows) {
      try {
        let result = await createMultipleHmIngredientComponents(rows)
        this.destroy()
        return result
      } catch (error) {
        console.log(error)
      }
    },
    handleHmIngredientsComponents(data) {
      this.hmIngredientComponents = data
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

      if (!values.name) {
        errors.name = [{ message: 'Name is required.' }]
      }

      if (!values.cost) {
        errors.cost = [{ message: 'Cost is required.' }]
      }

      if (!values.yield) {
        errors.yield = [{ message: 'Yield is required.' }]
      }

      return {
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    async onFormSubmit({ valid, values }) {
      try {
        if (this.hmIngredientComponents.length === 0) {
          valid = false
          this.notification.notify({
            message: `Homemade ingredient cannot be made without any ingredients.`,
            summary: 'No ingredients added',
            severity: 'error',
          })
        }
        console.log(values)

        if (valid) {
          let totalCost = this.calculateTotalCost(this.hmIngredientComponents, values.yield)
          await updateHmIngredient(
            values.name,
            totalCost.toFixed(2),
            values.notes,
            this.initialValues.image,
            values.unit,
            values.yield,
            values.is_stocked === true ? 1 : 0,
            this.$route.params.id,
          )

          let ingredients_data = this.hmIngredientComponents.map(
            ({ ingredient_id, selected_quantity, quantity }) => ({
              hm_ingredient_id: this.hmIngredientId,
              ingredient_id,
              selected_quantity: selected_quantity || quantity,
            }),
          )
          console.log(ingredients_data)

          await this.insertIngredientData(ingredients_data)
          this.notification.notify({
            message: `Homemade ingredient updated successfully`,
            summary: 'Update Success',
            severity: 'success',
          })
          this.$router.push('/hm')
        }
      } catch (error) {
        console.log(error)
      }
    },
    calculateTotalCost(ingredients, hmYield) {
      return (
        ingredients.reduce((total, ingredient) => {
          const quantity = ingredient.selected_quantity || ingredient.quantity
          const cost = quantity * ingredient.cost
          return total + cost
        }, 0) / hmYield
      )
    },
  },
  mounted() {
    this.hmIngredientId = this.$route.params.id
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
    <img class="w-80 h-auto" v-bind:src="hmIngredient.image" alt="Homemade Ingredient Image" />
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

      <!-- Unit input -->
      <div>
        <InputText
          name="unit"
          type="text"
          placeholder="Unit"
          fluid
          class="w-full rounded-md border border-gray-300 p-2"
        />
        <Message
          v-if="$form.unit?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1 text-red-600"
        >
          {{ $form.unit.error?.message }}
        </Message>
      </div>

      <!-- Yield input -->
      <div>
        <InputNumber
          name="yield"
          type="text"
          placeholder="Yield"
          :suffix="$form.unit?.value || ''"
          fluid
          class="w-full rounded-md"
        />
        <Message
          v-if="$form.yield?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1 text-red-600"
        >
          {{ $form.yield.error?.message }}
        </Message>
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

      <IngredientDatatable
        title="Ingredients"
        :ingredients="ingredients"
        :selectedIngredients="hmIngredientComponents"
        @selectedIngredients="handleHmIngredientsComponents"
      />

      <div class="flex justify-center items-center gap-2">
        <label for="is_stocked" class="text-gray-700">Is Stocked?</label>
        <ToggleSwitch title="Is Stocked?" name="is_stocked" id="is_stocked" />
      </div>

      <!-- Submit button -->
      <div class="flex justify-center">
        <Button type="submit" severity="secondary" label="Submit" class="w-48" />
      </div>
    </Form>
  </div>
</template>
