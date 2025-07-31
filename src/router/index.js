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
} from '@/components/cocktails'

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
          component: CocktailHome,
        },
        {
          path: 'view/:id',
          component: CocktailSpecific,
        },
        {
          path: 'create',
          name: 'create',
          component: CocktailCreate,
        },
        {
          path: 'edit/:id',
          name: 'edit',
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
      path: '/hm',
      name: 'hm',
      component: HmView,
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
