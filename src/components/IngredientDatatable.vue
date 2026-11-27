<script>
import { useNotificationStore } from '@/stores/notification.store'
import { createIngredient } from '@/api/ingredients'

export default {
  name: 'IngredientDatatable',
  setup() {
    const notification = useNotificationStore()
    return { notification }
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    ingredients: {
      type: Array,
      required: true,
    },
    selectedIngredients: {
      type: Array,
      required: true,
    },
    // When true, shows a "+ New" button to create a raw ingredient inline (without
    // leaving the cocktail form). Only meaningful for the raw-ingredient picker.
    allowCreate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      ingredientInput: '',
      filteredIngredients: [],
      // Inline "new ingredient" dialog state.
      showCreate: false,
      creating: false,
      createError: '',
      newIngredient: { name: '', unit: '', totalcost: null, totalquantity: null, inStock: true },
    }
  },
  emits: ['selectedIngredients', 'ingredient-created'],
  methods: {
    onSearch(event) {
      setTimeout(() => {
        if (!event.query.trim().length) {
          this.filteredIngredients = [...this.ingredients]
        } else {
          this.filteredIngredients = this.ingredients.filter((ingredient) => {
            return ingredient.name.toLowerCase().startsWith(event.query.toLowerCase())
          })
        }
      }, 250)
    },
    onDelete(id) {
      const updatedIngredients = this.selectedIngredients.filter((item) => {
        const itemId = item.hm_ingredient_id || item.ingredient_id
        return itemId !== id
      })
      this.$emit('selectedIngredients', updatedIngredients)
    },
    // Add an ingredient to the selected list (used by both search-select and inline-create).
    selectIngredient(ingredient) {
      const selectedId = ingredient.hm_ingredient_id || ingredient.ingredient_id
      const exists = this.selectedIngredients.some(
        (item) => (item.hm_ingredient_id || item.ingredient_id) === selectedId,
      )
      if (!exists) {
        this.$emit('selectedIngredients', [
          ...this.selectedIngredients,
          { selected_quantity: 1, ...ingredient },
        ])
      }
      this.ingredientInput = ''
    },
    onIngredientSelect(event) {
      this.selectIngredient(event.value)
    },
    openCreate() {
      this.newIngredient = {
        name: '',
        unit: '',
        totalcost: null,
        totalquantity: null,
        inStock: true,
      }
      this.createError = ''
      this.showCreate = true
    },
    async createNewIngredient() {
      this.createError = ''
      const { name, unit, totalcost, totalquantity, inStock } = this.newIngredient
      if (!name?.trim() || !unit?.trim() || !totalcost || !totalquantity) {
        this.createError = 'Name, unit, total cost, and quantity are all required.'
        return
      }
      this.creating = true
      try {
        // Cost per unit, same formula as the full ingredient form.
        const costPerUnit = parseFloat((Number(totalcost) / Number(totalquantity)).toFixed(4))
        const created = await createIngredient(
          name.trim(),
          unit.trim(),
          costPerUnit,
          inStock ? 1 : 0,
        )
        this.$emit('ingredient-created', created) // parent adds it to the searchable list
        this.selectIngredient(created) // and add it straight into this recipe
        this.notification.notify({
          message: `${created.name} created and added`,
          severity: 'success',
        })
        this.showCreate = false
      } catch (error) {
        console.error(error)
        this.createError = 'Could not create the ingredient — try again.'
      } finally {
        this.creating = false
      }
    },
  },
}
</script>

<template>
  <div>
    <Card class="w-full">
      <template #title>{{ title }}</template>

      <template #subtitle>
        <div class="flex gap-2 items-center">
          <AutoComplete
            v-model="ingredientInput"
            :suggestions="filteredIngredients"
            optionLabel="name"
            @complete="onSearch"
            @option-select="onIngredientSelect"
            class="flex-1"
            placeholder="Search Ingredients"
          />
          <Button
            v-if="allowCreate"
            label="New"
            icon="pi pi-plus"
            severity="secondary"
            @click="openCreate"
          />
        </div>
      </template>

      <template #content>
        <div v-if="selectedIngredients.length !== 0">
          <DataTable
            :value="selectedIngredients"
            tableStyle="min-width: 50rem; cursor: default;"
            class="mt-4"
          >
            <Column field="name" header="Name"></Column>

            <Column field="selected_quantity" header="Quantity">
              <template #body="slotProps">
                <InputNumber
                  :modelValue="slotProps.data.selected_quantity || slotProps.data.quantity"
                  id="selected_quantity"
                  :suffix="` ${slotProps.data.unit}`"
                  fluid
                  :min="0"
                  :minFractionDigits="0"
                  :maxFractionDigits="2"
                  class="w-full"
                  @update:modelValue="
                    (value) => {
                      const updated = selectedIngredients.map((item) => {
                        const itemId = item.hm_ingredient_id || item.ingredient_id
                        const slotId =
                          slotProps.data.hm_ingredient_id || slotProps.data.ingredient_id
                        if (itemId === slotId) {
                          return { ...item, selected_quantity: value }
                        }
                        return item
                      })
                      this.$emit('selectedIngredients', updated)
                    }
                  "
                />
              </template>
            </Column>

            <Column field="is_deleted" header="Delete">
              <template #body="slotProps">
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  rounded
                  aria-label="Cancel"
                  @click="onDelete(slotProps.data.ingredient_id || slotProps.data.hm_ingredient_id)"
                  class="p-2"
                />
              </template>
            </Column>
          </DataTable>
        </div>
        <div class="py-8 text-center text-gray-500 font-semibold" v-else>No ingredient added</div>
      </template>
    </Card>

    <!-- Inline create-ingredient dialog -->
    <Dialog v-model:visible="showCreate" modal header="New Ingredient" :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Name</label>
          <InputText v-model="newIngredient.name" placeholder="e.g. Vodka" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Unit</label>
          <InputText v-model="newIngredient.unit" placeholder="e.g. ml, oz, gram" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Total Cost ($)</label>
            <InputNumber
              v-model="newIngredient.totalcost"
              placeholder="0.00"
              :minFractionDigits="2"
              fluid
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Total Quantity</label>
            <InputNumber
              v-model="newIngredient.totalquantity"
              placeholder="0"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              fluid
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <InputSwitch v-model="newIngredient.inStock" inputId="newInStock" />
          <label for="newInStock" class="text-sm">In stock</label>
        </div>
        <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          :disabled="creating"
          @click="showCreate = false"
        />
        <Button
          :label="creating ? 'Creating…' : 'Create & Add'"
          :loading="creating"
          @click="createNewIngredient"
        />
      </template>
    </Dialog>
  </div>
</template>
