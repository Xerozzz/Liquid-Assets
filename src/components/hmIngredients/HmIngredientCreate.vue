<script>
import { useNotificationStore } from '@/stores/notification.store'
import { getIngredients } from '@/api/ingredients'
import { createMultipleHmIngredientComponents } from '@/api/hm_ingredient_components'
import { createHmIngredient } from '@/api/hm_ingredients'
import { useImageStorage } from '@/composables/useImageStorage'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  name: 'HmIngredientCreate',
  components: { IngredientDatatable },
  setup() {
    const notification = useNotificationStore()
    const { saveImage } = useImageStorage()
    return { notification, saveImage }
  },
  data() {
    return {
      ingredients: [],
      hmIngredientsComponents: [],
      selectedFileRaw: null,
      initialValues: {
        name: '',
        cost: 0,
        notes: '',
        yield: 0,
        unit: '',
        image: '',
        is_stocked: false,
      },
    }
  },
  methods: {
    async getIngredientsData() {
      try {
        this.ingredients = await getIngredients()
      } catch (error) {
        console.error(error)
      }
    },
    async insertIngredientData(rows) {
      try {
        let result = await createMultipleHmIngredientComponents(rows)
        return result
      } catch (error) {
        console.error(error)
      }
    },
    handleHmIngredientsComponents(data) {
      this.hmIngredientsComponents = data
    },

    // --- UPDATED IMAGE HANDLING ---
    onFileSelect(event) {
      const file = event.files[0]
      this.selectedFileRaw = file
      this.initialValues.image = URL.createObjectURL(file)
    },

    resolver: ({ values }) => {
      const errors = {}
      if (!values.name) errors.name = [{ message: 'Name is required.' }]
      if (!values.yield) errors.yield = [{ message: 'Yield is required.' }]
      if (!values.unit) errors.unit = [{ message: 'Unit is required.' }]
      return { values, errors }
    },
    calculateTotalCost(ingredients, hmYield) {
      if (!hmYield || hmYield == 0) return 0
      return (
        ingredients.reduce((total, ingredient) => {
          const cost = ingredient.selected_quantity * ingredient.cost
          return total + cost
        }, 0) / hmYield
      )
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
          // --- SAVE IMAGE TO STORAGE ---
          let finalImageFilename = ''
          if (this.selectedFileRaw) {
            finalImageFilename = await this.saveImage(this.selectedFileRaw)
          }

          let totalCost = this.calculateTotalCost(this.hmIngredientsComponents, values.yield)

          const createdHm = await createHmIngredient(
            values.name,
            totalCost.toFixed(2),
            values.notes,
            values.unit,
            values.yield,
            finalImageFilename,
            values.is_stocked ? 1 : 0,
          )
          const hmIngredientId = createdHm?.hm_ingredient_id

          if (hmIngredientId) {
            if (this.hmIngredientsComponents.length > 0) {
              let ingredients_data = this.hmIngredientsComponents.map(
                ({ ingredient_id, selected_quantity }) => ({
                  hm_ingredient_id: hmIngredientId,
                  ingredient_id,
                  selected_quantity,
                }),
              )
              await this.insertIngredientData(ingredients_data)
            }
          }
          this.$router.push('/hm')
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
    this.getIngredientsData()
  },
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Create Homemade Ingredient</h1>

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
          <InputText name="name" placeholder="e.g. Lavender Syrup" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Unit</label>
          <InputText name="unit" placeholder="e.g. ml, oz" fluid />
          <Message v-if="$form.unit?.invalid" severity="error" size="small" variant="simple">
            {{ $form.unit.error?.message }}
          </Message>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Yield Amount</label>
          <InputNumber
            name="yield"
            placeholder="0"
            :minFractionDigits="0"
            :maxFractionDigits="2"
            fluid
          />
          <Message v-if="$form.yield?.invalid" severity="error" size="small" variant="simple">
            {{ $form.yield.error?.message }}
          </Message>
        </div>

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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Notes</label>
          <Textarea
            name="notes"
            placeholder="Shelf life, storage instructions, etc."
            rows="3"
            fluid
            class="resize-y"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Inventory Status</label>
          <div class="flex items-center gap-2 mt-2">
            <ToggleSwitch name="is_stocked" />
            <span class="text-gray-700">Currently Stocked?</span>
          </div>
        </div>
      </div>

      <hr class="border-gray-200" />

      <div class="space-y-6">
        <IngredientDatatable
          title="Components (Raw Ingredients)"
          :ingredients="ingredients"
          :selectedIngredients="hmIngredientsComponents"
          @selectedIngredients="handleHmIngredientsComponents"
        />
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/hm')" />
        <Button type="submit" label="Create Ingredient" class="w-48" />
      </div>
    </Form>
  </div>
</template>
