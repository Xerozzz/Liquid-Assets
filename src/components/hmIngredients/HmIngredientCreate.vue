<script>
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'
import { getIngredients } from '@/api/ingredients'
import { createMultipleHmIngredientComponents } from '@/api/hm_ingredient_components'
import { createHmIngredient } from '@/api/hm_ingredients'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  components: { IngredientDatatable },
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      ingredients: [],
      hmIngredientsComponents: [],
      initialValues: {
        name: '',
        cost: 0,
        notes: '',
        yield: 0,
        unit: '',
        image: '',
        is_stocked: 0,
      },
    }
  },
  methods: {
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
      this.hmIngredientsComponents = data
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

      if (!values.yield) {
        errors.yield = [{ message: 'Yield is required.' }]
      }

      if (!values.cost) {
        errors.cost = [{ message: 'Cost is required.' }]
      }

      return {
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    calculateTotalCost(ingredients, hmYield) {
      return ingredients.reduce((total, ingredient) => {
        const cost = ingredient.selected_quantity * ingredient.cost
        return total + cost
      }, 0) / hmYield
    },
    async onFormSubmit({ valid, values }) {
      try {
        if (this.hmIngredientsComponents.length === 0) {
          valid = false
          this.notification.notify({
            message: `Homemade ingredients cannot be made without any ingredients.`,
            summary: 'No ingredients added',
            severity: 'error',
          })
        }

        if (valid) {
          let totalCost = this.calculateTotalCost(this.hmIngredientsComponents, values.yield)
          let hmIngredientId = await createHmIngredient(
            values.name,
            totalCost.toFixed(2),
            values.notes,
            values.unit,
            values.yield,
            this.initialValues.image,
            values.is_stocked === true ? 1 : 0,
          )

          if (hmIngredientId) {
            if (this.hmIngredientsComponents.length > 0) {
              console.log(this.hmIngredientsComponents)

              let ingredients_data = this.hmIngredientsComponents.map(
                ({ ingredient_id, selected_quantity }) => ({
                  hm_ingredient_id: hmIngredientId,
                  ingredient_id,
                  selected_quantity,
                }),
              )

              let result = await this.insertIngredientData(ingredients_data)
              console.log(result)
            }
          }
          this.$router.push('/hm')
        }
      } catch (error) {
        console.log(error)
      }
    },
  },
  mounted() {
    this.getIngredientsData()
  },
}
</script>

<template>
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
      :selectedIngredients="hmIngredientsComponents"
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
</template>
