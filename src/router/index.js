import { createRouter, createWebHistory } from 'vue-router'

// Import Views
import HomeView from '../views/HomeView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'
import IngredientView from '@/views/IngredientView.vue'
import HmView from '@/views/HmView.vue'
import GlasswareView from '@/views/GlasswareView.vue'

// Import Cocktail Components
import CocktailView from '@/views/CocktailView.vue'
import {
  CocktailCreate,
  CocktailEdit,
  CocktailSpecific,
  CocktailHome,
} from '@/components/cocktails/'
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
  HmIngredientHome
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
      path: '/cocktail',
      name: 'cocktail',
      component: CocktailView,
      children: [
        {
          path: '',
          name: 'cocktail-home',
          component: CocktailHome,
        },
        {
          path: 'view/:id',
          name: 'cocktail-specific',
          component: CocktailSpecific,
        },
        {
          path: 'create',
          name: 'cocktail-create',
          component: CocktailCreate,
        },
        {
          path: 'edit/:id',
          name: 'cocktail-edit',
          component: CocktailEdit,
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
          path: 'create',
        },
        {
          path: 'edit',
        },
        {
          path: 'card',
        },
      ],
    },
    {
      path: '/playground',
      name: 'playground',
      component: PlaygroundView,
    },
    {
      path: '/docs',
      beforeEnter() {
        // Redirect to the static HTML file
        window.location.href = '/docs/index.html'
      },
    },
  ],
})

export default router
