<script>
import { useNotificationStore } from '@/stores/notification.store'

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
  },
  data() {
    return {
      ingredientInput: '',
      filteredIngredients: [],
      // selectedIngredients: [],
    }
  },
  emits: ['selectedIngredients'],
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
    onIngredientSelect(event) {
      const idKey = event.value.hm_ingredient_id ? 'hm_ingredient_id' : 'ingredient_id'
      const selectedId = event.value[idKey]
      const exists = this.selectedIngredients.some((item) => {
        const itemId = item.hm_ingredient_id || item.ingredient_id
        return itemId === selectedId
      })

      if (!exists) {
        const updatedIngredients = [
          ...this.selectedIngredients,
          { selected_quantity: 1, ...event.value },
        ]
        console.log(updatedIngredients)

        this.$emit('selectedIngredients', updatedIngredients)
      } else {
        console.log('Ingredient already exists in the list.')
      }

      this.ingredientInput = ''
    },
  },
}
</script>

<template>
  <div>
    <Card class="w-full">
      <template #title>{{ title }}</template>

      <template #subtitle>
        <AutoComplete
          v-model="ingredientInput"
          :suggestions="filteredIngredients"
          optionLabel="name"
          @complete="onSearch"
          @option-select="onIngredientSelect"
          class="w-full"
          placeholder="Search Ingredients"
        />
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
  </div>
</template>
