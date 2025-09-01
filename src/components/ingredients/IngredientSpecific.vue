<script>
import { deleteIngredient, getIngredientById } from '@/api/ingredients.js'

import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'

import DeleteDialog from '../DeleteDialog.vue'

export default {
  name: 'IngredientSpecific',
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      loading: true,
      ingredient: null,
      error: null,
    }
  },
  methods: {
    async fetchIngredient() {
      try {
        const ingredientId = this.$route.params.id
        const ingredient = await getIngredientById(ingredientId) // returns ingredient from your query

        if (!ingredient || ingredient.length === 0) {
          this.error = new Error('Ingredient not found')
          return
        }
        this.ingredient = ingredient
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Ingredient',
        message: 'This action cannot be undone. Do you want to proceed?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Delete',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        rejectClass: 'p-button-text',
        accept: () => {
          this.deleteItem()
        },
        reject: () => {
          this.cancelAction()
        },
      })
    },
    async deleteItem() {
      try {
        await deleteIngredient(this.$route.params.id)
        this.notification.notify({
          message: `Ingredient deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace('/ingredient')
      } catch (error) {
        console.log(error)
      }
    },
    cancelAction() {},
  },
  mounted() {
    this.fetchIngredient()
  },
  unmounted() {
    this.destroy()
  },
}
</script>

<template>
  <DeleteDialog />
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else class="bodysection">
    <button class="nav_button" @click="$router.push('/ingredient')">Back</button>
    <button class="nav_button" @click="$router.push(`/ingredient/edit/${this.$route.params.id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>
    <div class="grid grid-cols gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ ingredient.name }}</h2>
        <img
          class="w-80 h-auto"
          :src="ingredient.image"
          alt="ingredient Image"
          v-if="ingredient.image"
        />
        <h3>Cost/{{ ingredient.unit }}</h3>
        <p>${{ ingredient.cost.toFixed(2) }}</p>
        <h3>Unit</h3>
        <p>{{ ingredient.unit }}</p>
        <h3>Is Stocked?</h3>
        <p>{{ ingredient.is_stocked ? 'Yes' : 'No' }}</p>
      </div>
    </div>
  </div>
</template>
