import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'
import CocktailView from '../views/CocktailView.vue'
import CocktailCreate from '@/components/cocktails/CocktailCreate.vue'
import IngredientView from '../views/IngredientView.vue'
import HmView from '../views/HmView.vue'
import GlasswareView from '../views/GlasswareView.vue'
import CocktailEdit from '@/components/cocktails/CocktailEdit.vue'
import CocktailSpecific from '@/components/cocktails/CocktailSpecific.vue'
import CocktailHome from '@/components/cocktails/CocktailHome.vue'

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
        {
          path: 'card',
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
