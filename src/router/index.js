import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'
import CocktailView from '../views/CocktailView.vue'
import IngredientView from '../views/IngredientView.vue'
import HmView from '../views/HmView.vue'
import GlasswareView from '../views/GlasswareView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/',
      name: 'cocktail',
      component: CocktailView,
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
      path: '/',
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
      path: '/',
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
      path: '/',
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
  ],
})

export default router
