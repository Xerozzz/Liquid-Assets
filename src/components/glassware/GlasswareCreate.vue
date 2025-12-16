<script>
import { createGlassware } from '@/api/glassware'
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'GlasswareCreate',
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      initialValues: {
        brand: '',
        model: '',
        volume: null,
        volume_fill: null,
      },
    }
  },
  methods: {
    resolver: ({ values }) => {
      const errors = {}
      if (!values.brand) errors.brand = [{ message: 'Brand is required.' }]
      if (!values.model) errors.model = [{ message: 'Model is required.' }]
      if (!values.volume) errors.volume = [{ message: 'Volume is required.' }]

      return { values, errors }
    },
    async onFormSubmit({ valid, values }) {
      if (valid) {
        try {
          await createGlassware(values.brand, values.model, values.volume, values.volume_fill)

          this.notification.notify({
            message: 'Glassware added successfully',
            severity: 'success',
          })
          this.destroy()
          this.$router.push('/glassware')
        } catch (error) {
          console.error(error)
          this.notification.notify({
            message: 'Error creating glassware',
            severity: 'error',
          })
        }
      }
    },
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Add New Glassware</h1>

    <Form
      v-slot="$form"
      :initialValues
      :resolver
      @submit="onFormSubmit"
      class="space-y-6 bg-white p-8 rounded-lg shadow-md"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label for="brand" class="font-semibold">Brand</label>
          <InputText name="brand" placeholder="e.g. Riedel" fluid />
          <Message v-if="$form.brand?.invalid" severity="error" size="small" variant="simple">
            {{ $form.brand.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="model" class="font-semibold">Model</label>
          <InputText name="model" placeholder="e.g. Nick & Nora" fluid />
          <Message v-if="$form.model?.invalid" severity="error" size="small" variant="simple">
            {{ $form.model.error?.message }}
          </Message>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label for="volume" class="font-semibold">Total Volume (ml)</label>
          <InputNumber name="volume" placeholder="Total capacity" fluid :min="0" />
          <Message v-if="$form.volume?.invalid" severity="error" size="small" variant="simple">
            {{ $form.volume.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label for="volume_fill" class="font-semibold">Fill Volume (ml)</label>
          <InputNumber name="volume_fill" placeholder="Washline volume" fluid :min="0" />
        </div>
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/glassware')" />
        <Button type="submit" label="Save Glassware" />
      </div>
    </Form>
  </div>
</template>
