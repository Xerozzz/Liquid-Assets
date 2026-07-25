import { createRouter, createWebHistory } from 'vue-router'

// Import Views
import HomeView from '../views/HomeView.vue'
import IngredientView from '@/views/IngredientView.vue'
import HmView from '@/views/HmView.vue'
import GlasswareView from '@/views/GlasswareView.vue'
import RestockView from '@/views/RestockView.vue'

// Import glassware components
import {
  GlasswareHome,
  GlasswareCreate,
  GlasswareEdit,
  GlasswareSpecific,
} from '@/components/glassware/'

// Import Recipe Components — shared by both the /cocktail and /mocktail route trees,
// distinguished at runtime via each route's `meta.isMocktail` (see AGENTS.md).
import RecipeView from '@/views/RecipeView.vue'
import { RecipeCreate, RecipeEdit, RecipeSpecific, RecipeHome } from '@/components/recipes/'
import {
  IngredientHome,
  IngredientSpecific,
  IngredientCreate,
  IngredientEdit,
} from '@/components/ingredients'

import {
  HmIngredientCreate,
  HmIngredientEdit,
  HmIngredientSpecific,
  HmIngredientHome,
} from '@/components/hmIngredients'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/restock',
      name: 'restock',
      component: RestockView,
    },
    {
      path: '/cocktail',
      name: 'cocktail',
      component: RecipeView,
      meta: { isMocktail: false },
      children: [
        {
          path: '',
          name: 'cocktail-home',
          component: RecipeHome,
        },
        {
          path: 'view/:id',
          name: 'cocktail-specific',
          component: RecipeSpecific,
        },
        {
          path: 'create',
          name: 'cocktail-create',
          component: RecipeCreate,
        },
        {
          path: 'edit/:id',
          name: 'cocktail-edit',
          component: RecipeEdit,
        },
      ],
    },
    {
      path: '/mocktail',
      name: 'mocktail',
      component: RecipeView,
      meta: { isMocktail: true },
      children: [
        {
          path: '',
          name: 'mocktail-home',
          component: RecipeHome,
        },
        {
          path: 'view/:id',
          name: 'mocktail-specific',
          component: RecipeSpecific,
        },
        {
          path: 'create',
          name: 'mocktail-create',
          component: RecipeCreate,
        },
        {
          path: 'edit/:id',
          name: 'mocktail-edit',
          component: RecipeEdit,
        },
      ],
    },
    {
      path: '/ingredient',
      name: 'ingredient',
      component: IngredientView,
      children: [
        {
          path: '',
          component: IngredientHome,
        },
        {
          path: 'view/:id',
          component: IngredientSpecific,
        },
        {
          path: 'create',
          name: 'create',
          component: IngredientCreate,
        },
        {
          path: 'edit/:id',
          name: 'edit',
          component: IngredientEdit,
        },
      ],
    },
    {
      path: '/hm',
      name: 'hm',
      component: HmView,
      children: [
        {
          path: '',
          name: 'hm-home',
          component: HmIngredientHome,
        },
        {
          path: 'view/:id',
          name: 'hm-specific',
          component: HmIngredientSpecific,
        },
        {
          path: 'create',
          name: 'hm-create',
          component: HmIngredientCreate,
        },
        {
          path: 'edit/:id',
          name: 'hm-edit',
          component: HmIngredientEdit,
        },
      ],
    },
    {
      path: '/glassware',
      name: 'glassware',
      component: GlasswareView,
      children: [
        {
          path: '',
          component: GlasswareHome,
        },
        {
          path: 'create',
          name: 'glassware-create',
          component: GlasswareCreate,
        },
        {
          path: 'edit/:id',
          name: 'glassware-edit',
          component: GlasswareEdit,
        },
        {
          path: 'view/:id',
          name: 'glassware-view',
          component: GlasswareSpecific,
        },
      ],
    },
  ],
})

export default router
