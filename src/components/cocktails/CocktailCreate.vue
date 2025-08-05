<script>
import { getGlassware } from '@/api/glassware'
import { getHmIngredient } from '@/api/hm_ingredients'
import { getIngredients } from '@/api/ingredients'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import { Form } from '@primevue/forms'

import FileUpload from 'primevue/fileupload'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select';

export default {
  setup() {
    const notification = useNotificationStore()
    const { destory } = useSQLite()
    return { notification, destory }
  },
  data() {
    return {
      ingredients: {},
      hm_ingredients: {},
      glassware: {},
      initialValues: {
        name: '',
        glass_id: '',
        step_to_make: '',
        garnish: '',
        notes: '',
        image: null,
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
        this.getGlassware = await getGlassware()
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

      if (!values.username) {
        errors.username = [{ message: 'Username is required.' }]
      }

      return {
        values, // (Optional) Used to pass current form values to submit event.
        errors,
      }
    },
    onFormSubmit({ valid }) {
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
  <div class="card flex justify-center">
    <Toast />

    <Form
      v-slot="$form"
      :initialValues
      :resolver
      @submit="onFormSubmit"
      class="flex flex-col gap-4 w-full sm:w-56"
    >
      <!-- Name Field -->
      <div class="flex flex-col gap-2">
        <InputText name="name" type="text" placeholder="Name" fluid />
        <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
          {{ $form.name.error?.message }}
        </Message>
      </div>

      <!-- Glass ID Field -->
      <div class="flex flex-col gap-1">
        <InputNumber name="glass_id" placeholder="Glass ID" fluid />
        <Select name="glass_id" :options="glassware" optionLabel="name" placeholder="Select Glass" fluid />
        <Message v-if="$form.glass_id?.invalid" severity="error" size="small" variant="simple">
          {{ $form.glass_id.error?.message }}
        </Message>
      </div>

      <!-- Step to Make Field -->
      <div class="flex flex-col gap-1">
        <Textarea name="step_to_make" placeholder="Steps to Make" rows="3" fluid />
        <Message v-if="$form.step_to_make?.invalid" severity="error" size="small" variant="simple">
          {{ $form.step_to_make.error?.message }}
        </Message>
      </div>

      <!-- Garnish Field (Optional) -->
      <div class="flex flex-col gap-1">
        <InputText name="garnish" type="text" placeholder="Garnish (Optional)" fluid />
        <Message v-if="$form.garnish?.invalid" severity="error" size="small" variant="simple">
          {{ $form.garnish.error?.message }}
        </Message>
      </div>

      <!-- Notes Field (Optional) -->
      <div class="flex flex-col gap-1">
        <Textarea name="notes" placeholder="Notes (Optional)" rows="2" fluid />
        <Message v-if="$form.notes?.invalid" severity="error" size="small" variant="simple">
          {{ $form.notes.error?.message }}
        </Message>
      </div>

      <!-- Image Upload (Optional) -->
      <div class="flex flex-col gap-1">
        <FileUpload
          name="image"
          @upload="onAdvancedUpload($event)"
          :multiple="true"
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
      <Button type="submit" severity="secondary" label="Submit" />
    </Form>
  </div>
</template>
