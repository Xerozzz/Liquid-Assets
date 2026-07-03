<script>
import { getGlasswareById, updateGlassware } from '@/api/glassware'
import { useNotificationStore } from '@/stores/notification.store'

export default {
  name: 'GlasswareEdit',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  data() {
    return {
      glassId: null,
      formValues: {
        brand: '',
        model: '',
        volume: '',
        volume_fill: '',
      },
      isLoading: true,
    }
  },
  methods: {
    async loadData() {
      try {
        const data = await getGlasswareById(this.glassId)

        if (data) {
          this.formValues = {
            brand: data.brand,
            model: data.model,
            volume: data.volume,
            volume_fill: data.volume_w_ice,
          }
        } else {
          this.notification.notify({
            message: 'Glassware not found',
            severity: 'error',
          })
          this.$router.push('/glassware')
        }
      } catch (error) {
        console.error(error)
        this.notification.notify({ message: 'Error loading glass', severity: 'error' })
      } finally {
        this.isLoading = false
      }
    },

    /** * VALIDATION LOGIC */
    resolver: ({ values }) => {
      const errors = {}

      if (!values.brand) errors.brand = [{ message: 'Brand is required.' }]
      if (!values.model) errors.model = [{ message: 'Model is required.' }]
      if (!values.volume) errors.volume = [{ message: 'Total volume is required.' }]

      // Check if Fill Volume is empty
      if (!values.volume_fill) {
        errors.volume_fill = [{ message: 'Fill volume is required.' }]
      }
      // Check if Fill Volume > Total Volume
      else if (Number(values.volume_fill) > Number(values.volume)) {
        errors.volume_fill = [{ message: 'Fill volume cannot exceed Total Volume.' }]
      }

      return { values, errors }
    },
    async onFormSubmit({ valid, values }) {
      if (valid) {
        try {
          await updateGlassware(
            values.brand,
            values.model,
            Number(values.volume),
            Number(values.volume_fill),
            this.glassId,
          )
          this.notification.notify({ message: 'Updated successfully', severity: 'success' })
          this.$router.push('/glassware')
        } catch (error) {
          console.error(error)
          this.notification.notify({ message: 'Error updating', severity: 'error' })
        }
      }
    },
  },
  mounted() {
    this.glassId = this.$route.params.id
    this.loadData()
  },
}
</script>

<template>
  <div v-if="isLoading" class="flex justify-center p-10"><ProgressSpinner /></div>
  <div v-else class="max-w-4xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6 text-center">Edit Glassware</h1>

    <Form
      v-slot="$form"
      :initialValues="formValues"
      :resolver="resolver"
      @submit="onFormSubmit"
      class="space-y-6 bg-white p-8 rounded-lg shadow-md"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Brand</label>
          <InputText name="brand" fluid />
          <Message v-if="$form.brand?.invalid" severity="error" size="small" variant="simple">
            {{ $form.brand.error?.message }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Model</label>
          <InputText name="model" fluid />
          <Message v-if="$form.model?.invalid" severity="error" size="small" variant="simple">
            {{ $form.model.error?.message }}
          </Message>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">Total Volume (ml)</label>
          <InputText name="volume" type="number" step="0.01" fluid />
          <Message v-if="$form.volume?.invalid" severity="error" size="small" variant="simple">
            {{ $form.volume.error?.message }}
          </Message>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold">Fill Volume (with Ice)</label>
          <InputText name="volume_fill" type="number" step="0.01" fluid />
          <Message v-if="$form.volume_fill?.invalid" severity="error" size="small" variant="simple">
            {{ $form.volume_fill.error?.message }}
          </Message>
        </div>
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <Button label="Cancel" severity="secondary" @click="$router.push('/glassware')" />
        <Button type="submit" label="Update Glassware" />
      </div>
    </Form>
  </div>
</template>
