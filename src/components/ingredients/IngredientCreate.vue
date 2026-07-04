<script>
import { createIngredient } from '@/api/ingredients'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'IngredientCreate',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      initialValues: {
        name: '',
        unit: '',
        totalcost: null,
        totalquantity: null,
        isstocked: false,
      },
    }
  },
  methods: {
    resolver: ({ values }) => {
      const errors = {}
      if (!values.name) errors.name = [{ message: 'Name is required.' }]
      if (!values.unit) errors.unit = [{ message: 'Unit is required.' }]
      if (!values.totalcost) errors.totalcost = [{ message: 'Total Cost is required' }]
      if (!values.totalquantity) errors.totalquantity = [{ message: 'Quantity is required' }]
      return { values, errors }
    },
    async onFormSubmit({ valid, values }) {
      try {
        if (valid) {
          // Calculate cost per unit
          const costPerUnit = (Number(values.totalcost) / Number(values.totalquantity)).toFixed(4)

          await createIngredient(
            values.name,
            values.unit,
            parseFloat(costPerUnit),
            values.isstocked ? 1 : 0,
          )
          this.notification.notify({
            message: `Ingredient created successfully`,
            severity: 'success',
          })
          this.$router.push('/ingredient')
        }
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Error creating ingredient', severity: 'error' })
      }
    },
  },
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Add New Ingredient</h1>

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
          <InputText name="name" placeholder="e.g. Vodka" fluid />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Unit</label>
          <InputText name="unit" placeholder="e.g. ml, oz, gram" fluid />
          <Message v-if="$form.unit?.invalid" severity="error" size="small" variant="simple">
            {{ $form.unit.error?.message }}
          </Message>
        </div>
      </div>

      <div class="p-4 bg-gray-50 rounded-md border border-gray-100">
        <h3 class="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
          Price Calculator
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-semibold">Total Price Paid ($)</label>
            <InputNumber name="totalcost" placeholder="0.00" :minFractionDigits="2" fluid />
            <Message v-if="$form.totalcost?.invalid" severity="error" size="small" variant="simple">
              {{ $form.totalcost.error?.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-semibold">Total Quantity Purchased</label>
            <InputNumber name="totalquantity" placeholder="0" fluid />
            <Message
              v-if="$form.totalquantity?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.totalquantity.error?.message }}
            </Message>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <InputSwitch name="isstocked" />
        <label for="isstocked" class="font-medium text-gray-700">Currently In Stock?</label>
      </div>

      <div class="flex justify-center gap-4 mt-4">
        <Button label="Cancel" severity="secondary" @click="$router.push('/ingredient')" />
        <Button type="submit" label="Save Ingredient" class="w-48" />
      </div>
    </Form>
  </div>
</template>
