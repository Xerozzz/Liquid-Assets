<script>
import { useSQLite } from '@/composables/useSQLite'
import { useNotificationStore } from '@/stores/notification.store'
import { getHmIngredientWithComponents, deleteHmIngredient } from '@/api/hm_ingredients'

import DeleteDialog from '../DeleteDialog.vue'

export default {
  components: { DeleteDialog },
  setup() {
    const notification = useNotificationStore()
    const { destroy } = useSQLite()
    return { notification, destroy }
  },
  data() {
    return {
      loading: true,
      hmIngredient: null,
      error: null,
      ingredients: [],
      totalCost: 0,
    }
  },
  methods: {
    async getHmIngredient() {
      try {
        const hm_ingredient_id = this.$route.params.id
        const rows = await getHmIngredientWithComponents(hm_ingredient_id) // returns rows from your query

        if (!rows || rows.length === 0) {
          this.error = new Error('Hm ingredient not found')
          return
        }

        const r = rows[0]
        this.hmIngredient = {
          id: r.hm_ingredient_id,
          name: r.hm_ingredient_name,
          cost: r.hm_ingredient_cost,
          image: r.hm_ingredient_image,
          unit: r.hm_ingredient_unit,
          yield: r.hm_ingredient_yield,
          notes: r.hm_ingredient_notes,
        }

        const items = rows.map((row) => ({
          id: row.component_id,
          name: row.component_name,
          quantity: row.component_quantity,
          stock: row.component_stock ? '✅' : '❌',
          unit: row.component_unit,
          cost: Number(row.component_cost),
        }))

        this.ingredients = items
        this.totalCost = items.reduce((sum, item) => sum + item.cost, 0)
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    confirmDelete() {
      this.$confirm.require({
        header: 'Delete Homemade Ingredient',
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
        await deleteHmIngredient(this.$route.params.id)
        this.notification.notify({
          message: `Homemade ingredient deleted successfully`,
          summary: 'Delete Success',
          severity: 'success',
        })
        this.$router.replace('/hm')
      } catch (error) {
        console.log(error)
      }
    },
    cancelAction() {},
  },
  mounted() {
    this.getHmIngredient()
  },
}
</script>

<template>
  <DeleteDialog />
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else class="bodysection">
    <button class="nav_button" @click="$router.push('/hm')">Back</button>
    <button class="nav_button" @click="$router.push(`/hm/edit/${this.$route.params.id}`)">
      Edit
    </button>
    <button class="nav_button" @click="confirmDelete">Delete</button>
    <div class="grid grid-cols-3 gap-11">
      <div class="sectionbox">
        <h2 class="title">{{ hmIngredient.name }}</h2>
        <img
          class="w-80 h-auto"
          :src="hmIngredient.image"
          alt="Homemade Ingredient Image"
          v-if="hmIngredient.image"
        />
        <h3>Unit:</h3>
        <p>{{ hmIngredient.unit }}</p>
        <h3>Yield:</h3>
        <p>{{ hmIngredient.yield }}</p>
        <h3>Notes:</h3>
        <p>{{ hmIngredient.notes }}</p>
        <h3>Total Cost:</h3>
        <p>${{ this.hmIngredient.cost.toFixed(2) }}</p>
      </div>

      <div class="sectionbox">
        <h3>Components:</h3>
        <p>Total Cost: ${{ totalCost.toFixed(2) }}</p>
        <table class="text-center">
          <thead>
            <tr>
              <th>Component</th>
              <th>Quantity</th>
              <th>Cost</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in ingredients" :key="item.id">
              <td>{{ item.name }}</td>
              <td>
                {{ item.quantity }} <span v-if="item.unit">{{ item.unit }}</span>
              </td>
              <td>${{ Number(item.cost).toFixed(2) }}</td>
              <td>{{ item.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
