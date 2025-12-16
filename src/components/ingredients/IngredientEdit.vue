<script>
import { updateIngredient, getIngredientById } from '@/api/ingredients'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'IngredientEdit',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      isLoading: true,
      ingredientId: 0,
      ingredient: null,
      initialValues: {
        name: '',
        unit: '',
        isstocked: false,
        // Helper fields for calculator
        totalcost: null,
        totalquantity: null
      },
    }
  },
  methods: {
    async fetchIngredient() {
      try {
        const id = this.$route.params.id
        const result = await getIngredientById(id)

        // Handle if API returns array or object (safeguard)
        const ingredient = Array.isArray(result) ? result[0] : result

        if (!ingredient) {
          this.notification.notify({ message: 'Ingredient not found', severity: 'error' })
          this.$router.push('/ingredient')
          return
        }

        this.ingredient = ingredient
        this.ingredientId = ingredient.ingredient_id

        this.initialValues = {
          name: ingredient.name,
          unit: ingredient.unit,
          isstocked: ingredient.is_stocked === 1,
          totalcost: null,
          totalquantity: null
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },
    resolver: ({ values }) => {
      const errors = {}
      if (!values.name) errors.name = [{ message: 'Name is required.' }]
      if (!values.unit) errors.unit = [{ message: 'Unit is required.' }]
      return { values, errors }
    },
    async onFormSubmit({ valid, values }) {
      try {
        if (valid) {
          let finalCost = this.ingredient.cost

          if (values.totalcost && values.totalquantity) {
             finalCost = (Number(values.totalcost) / Number(values.totalquantity)).toFixed(4)
          }

          await updateIngredient(
            values.name,
            values.unit,
            parseFloat(finalCost),
            values.isstocked ? 1 : 0,
            this.ingredientId,
          )
          this.notification.notify({ message: 'Updated successfully', severity: 'success' })
          this.destroy()
          this.$router.push('/ingredient')
        }
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Error updating', severity: 'error' })
      }
    },
  },
  mounted() {
    this.fetchIngredient()
  },
}
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="max-w-4xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Edit Ingredient</h1>

    <Form
      v-slot="$form"
      :initialValues="initialValues"
      :resolver="resolver"
      @submit="onFormSubmit"
      class="bg-white p-8 rounded-lg shadow-md space-y-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Name</label>
          <InputText name="name" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Unit</label>
          <InputText name="unit" fluid />
          <Message v-if="$form.unit?.invalid" severity="error" size="small" variant="simple">
            {{ $form.unit.error?.message }}
          </Message>
        </div>
      </div>

      <div class="p-4 bg-gray-50 rounded-md border border-gray-100">
         <div class="flex justify-between items-center mb-3">
             <h3 class="text-sm font-bold text-gray-500 uppercase">Update Cost (Optional)</h3>
             <span class="text-sm text-gray-600">Current Cost: <strong>${{ ingredient.cost.toFixed(2) }} / {{ ingredient.unit }}</strong></span>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div class="flex flex-col gap-1">
                 <label class="text-sm font-semibold text-gray-700">New Price Paid</label>
                 <InputNumber name="totalcost" placeholder="Leave empty to keep current" :minFractionDigits="2" fluid />
             </div>
             <div class="flex flex-col gap-1">
                 <label class="text-sm font-semibold text-gray-700">New Quantity</label>
                 <InputNumber name="totalquantity" placeholder="Leave empty to keep current" fluid />
             </div>
         </div>
      </div>

      <div class="flex items-center gap-3">
        <InputSwitch name="isstocked" />
        <label class="font-medium text-gray-700">In Stock</label>
      </div>

      <div class="flex justify-center gap-4 mt-4">
        <Button label="Cancel" severity="secondary" @click="$router.push('/ingredient')" />
        <Button type="submit" label="Save Changes" class="w-48" />
      </div>
    </Form>
  </div>
</template>
