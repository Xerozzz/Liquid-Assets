<script>
import { useNotificationStore } from '@/stores/notification.store'
import { useImageStorage } from '@/composables/useImageStorage'

import {
  getHmIngredientComponentByHmIngredientId,
  createMultipleHmIngredientComponents,
} from '@/api/hm_ingredient_components'
import { getIngredients } from '@/api/ingredients'
import { getHmIngredientById, updateHmIngredient } from '@/api/hm_ingredients'

import IngredientDatatable from '../IngredientDatatable.vue'

export default {
  name: 'HmIngredientEdit',
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
      hmIngredient: {},
      ingredients: [],
      hmIngredientComponents: [],
      hmIngredientId: null,
      selectedFileRaw: null,
      previewImageUrl: null,
      resolvedImageUrl: null,
      initialValues: {
        name: '',
        cost: 0,
        notes: '',
        unit: '',
        yield: 0,
        image: '',
        is_stocked: false,
      },
    }
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
      this.ingredients = await getIngredients()
    },
    async getHmIngredientData() {
      let data = await getHmIngredientById(this.$route.params.id)
      if (!data) {
        this.$router.replace('/hm')
        return
      }
      this.hmIngredient = data
      this.initialValues = {
        name: this.hmIngredient.name,
        cost: this.hmIngredient.cost,
        notes: this.hmIngredient.notes,
        unit: this.hmIngredient.unit,
        yield: this.hmIngredient.yield,
        image: this.hmIngredient.image,
        is_stocked: this.hmIngredient.is_stocked === 1,
      }
    },
    async getHmIngredientComponentsData() {
      let components = await getHmIngredientComponentByHmIngredientId(this.$route.params.id)
      // Map components to match IngredientDatatable format
      this.hmIngredientComponents = components.map((c) => ({
        ...c,
        selected_quantity: c.quantity, // Ensure pre-filled quantity maps correctly
      }))
    },
    async insertIngredientData(rows) {
      return await createMultipleHmIngredientComponents(rows)
    },
    handleHmIngredientsComponents(data) {
      this.hmIngredientComponents = data
    },
    onFileSelect(event) {
      const file = event.files[0]
      this.selectedFileRaw = file
      this.previewImageUrl = URL.createObjectURL(file)
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
          const quantity = ingredient.selected_quantity || ingredient.quantity
          const cost = quantity * ingredient.cost
          return total + cost
        }, 0) / hmYield
      )
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

        if (valid) {
          let totalCost = this.calculateTotalCost(this.hmIngredientComponents, values.yield)

          let imageValue = this.initialValues.image
          if (this.selectedFileRaw) {
            imageValue = await this.saveImage(this.selectedFileRaw)
          }

          await updateHmIngredient(
            values.name,
            totalCost.toFixed(2),
            values.notes,
            imageValue,
            values.unit,
            values.yield,
            values.is_stocked ? 1 : 0,
            this.$route.params.id,
          )

          let ingredients_data = this.hmIngredientComponents.map(
            ({ ingredient_id, selected_quantity, quantity }) => ({
              hm_ingredient_id: this.hmIngredientId,
              ingredient_id,
              selected_quantity: selected_quantity || quantity,
            }),
          )

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
  },
  mounted() {
    this.hmIngredientId = this.$route.params.id
    this.getData()
  },
}
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="max-w-5xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Edit Homemade Ingredient</h1>

    <div v-if="displayImageUrl" class="flex justify-center mb-6">
      <img
        :src="displayImageUrl"
        alt="Ingredient Image"
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
          <label class="font-semibold">Unit</label>
          <InputText name="unit" placeholder="Unit (ml, g, etc)" fluid />
          <Message v-if="$form.unit?.invalid" severity="error" size="small" variant="simple">
            {{ $form.unit.error?.message }}
          </Message>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Yield</label>
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Notes</label>
          <Textarea name="notes" placeholder="Notes..." rows="3" fluid class="resize-y" />
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
          title="Components"
          :ingredients="ingredients"
          :selectedIngredients="hmIngredientComponents"
          @selectedIngredients="handleHmIngredientsComponents"
        />
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/hm')" />
        <Button type="submit" label="Save Changes" class="w-48" />
      </div>
    </Form>
  </div>
</template>
