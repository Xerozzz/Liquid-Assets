<script>
import { createIngredient } from '@/api/ingredients'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      ingredient: null,
    }
  },
  methods: {
    /** This is for validating form data */
    resolver: ({ values }) => {
      const errors = {}

      if (!values.name) {
        errors.name = [{ message: 'Name is required.' }]
      }

      if (!values.unit) {
        errors.unit = [{ message: 'Unit is required.' }]
      }

      if (!values.totalcost || isNaN(Number(values.totalcost))) {
        errors.totalcost = [{ message: 'Total Cost is required and must be a number' }]
      }

      if (!values.totalquantity || isNaN(Number(values.totalquantity))) {
        errors.totalquantity = [{ message: 'Total Quantity is required and must be a number' }]
      }

      return {
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    async onFormSubmit({ valid, values }) {
      try {
        if (values.isstocked === null) {
          values.isstocked = false
        }
        var costPerUnit = (values.totalcost / values.totalquantity).toFixed(2)
        if (valid) {
          await createIngredient(
            values.name,
            values.unit,
            parseFloat(costPerUnit),
            values.isstocked ? 1 : 0,
          )
          this.notification.notify({
            message: `Ingredient created successfully`,
            summary: 'Success',
            severity: 'success',
          })
          this.$router.push('/ingredient')
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

    <!-- Total Cost input -->
    <div>
      <InputText
        name="totalcost"
        type="text"
        placeholder="Total Cost"
        fluid
        class="w-full rounded-md border border-gray-300 p-2"
      />
      <Message
        v-if="$form.totalcost?.invalid"
        severity="error"
        size="small"
        variant="simple"
        class="mt-1 text-red-600"
      >
        {{ $form.totalcost.error?.message }}
      </Message>
    </div>

    <!-- Total Quantity input -->
    <div>
      <InputText
        name="totalquantity"
        type="text"
        placeholder="Total Quantity"
        fluid
        class="w-full rounded-md border border-gray-300 p-2"
      />
      <Message
        v-if="$form.totalquantity?.invalid"
        severity="error"
        size="small"
        variant="simple"
        class="mt-1 text-red-600"
      >
        {{ $form.totalquantity.error?.message }}
      </Message>
    </div>

    <!-- Is Stocked input -->
    <div>
      <InputSwitch
        name="isstocked"
        :trueValue="true"
        :falseValue="false"
        :modelValue="false"
        class="w-full"
      />
      <label for="isstocked" class="ml-2">Is Stocked</label>
      <Message
        v-if="$form.isstocked?.invalid"
        severity="error"
        size="small"
        variant="simple"
        class="mt-1 text-red-600"
      >
        {{ $form.isstocked.error?.message }}
      </Message>
    </div>

    <!-- Submit button -->
    <div class="flex justify-center">
      <Button type="submit" severity="secondary" label="Submit" class="w-48" />
    </div>
  </Form>
</template>
