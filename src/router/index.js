import { createRouter, createWebHistory } from 'vue-router'

// Routes are lazy-loaded (`() => import(...)`) so each page becomes its own chunk.
// The initial download then only includes the landing page + shared code instead of
// the whole app (which pulls in heavy PrimeVue widgets — DataTable, FileUpload, Dialog —
// used only on the CRUD pages). Views/components are imported by their file path (not the
// barrel index files) so Vite can split each one out.

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/restock',
      name: 'restock',
      component: () => import('@/views/RestockView.vue'),
    },
    {
      path: '/cocktail',
      name: 'cocktail',
      component: () => import('@/views/RecipeView.vue'),
      meta: { isMocktail: false },
      children: [
        {
          path: '',
          name: 'cocktail-home',
          component: () => import('@/components/recipes/RecipeHome.vue'),
        },
        {
          path: 'view/:id',
          name: 'cocktail-specific',
          component: () => import('@/components/recipes/RecipeSpecific.vue'),
        },
        {
          path: 'create',
          name: 'cocktail-create',
          component: () => import('@/components/recipes/RecipeCreate.vue'),
        },
        {
          path: 'edit/:id',
          name: 'cocktail-edit',
          component: () => import('@/components/recipes/RecipeEdit.vue'),
        },
      ],
    },
    {
      path: '/mocktail',
      name: 'mocktail',
      component: () => import('@/views/RecipeView.vue'),
      meta: { isMocktail: true },
      children: [
        {
          path: '',
          name: 'mocktail-home',
          component: () => import('@/components/recipes/RecipeHome.vue'),
        },
        {
          path: 'view/:id',
          name: 'mocktail-specific',
          component: () => import('@/components/recipes/RecipeSpecific.vue'),
        },
        {
          path: 'create',
          name: 'mocktail-create',
          component: () => import('@/components/recipes/RecipeCreate.vue'),
        },
        {
          path: 'edit/:id',
          name: 'mocktail-edit',
          component: () => import('@/components/recipes/RecipeEdit.vue'),
        },
      ],
    },
    {
      path: '/ingredient',
      name: 'ingredient',
      component: () => import('@/views/IngredientView.vue'),
      children: [
        {
          path: '',
          component: () => import('@/components/ingredients/IngredientHome.vue'),
        },
        {
          path: 'view/:id',
          component: () => import('@/components/ingredients/IngredientSpecific.vue'),
        },
        {
          path: 'create',
          name: 'create',
          component: () => import('@/components/ingredients/IngredientCreate.vue'),
        },
        {
          path: 'edit/:id',
          name: 'edit',
          component: () => import('@/components/ingredients/IngredientEdit.vue'),
        },
      ],
    },
    {
      path: '/hm',
      name: 'hm',
      component: () => import('@/views/HmView.vue'),
      children: [
        {
          path: '',
          name: 'hm-home',
          component: () => import('@/components/hmIngredients/HmIngredientHome.vue'),
        },
        {
          path: 'view/:id',
          name: 'hm-specific',
          component: () => import('@/components/hmIngredients/HmIngredientSpecific.vue'),
        },
        {
          path: 'create',
          name: 'hm-create',
          component: () => import('@/components/hmIngredients/HmIngredientCreate.vue'),
        },
        {
          path: 'edit/:id',
          name: 'hm-edit',
          component: () => import('@/components/hmIngredients/HmIngredientEdit.vue'),
        },
      ],
    },
    {
      path: '/glassware',
      name: 'glassware',
      component: () => import('@/views/GlasswareView.vue'),
      children: [
        {
          path: '',
          component: () => import('@/components/glassware/GlasswareHome.vue'),
        },
        {
          path: 'create',
          name: 'glassware-create',
          component: () => import('@/components/glassware/GlasswareCreate.vue'),
        },
        {
          path: 'edit/:id',
          name: 'glassware-edit',
          component: () => import('@/components/glassware/GlasswareEdit.vue'),
        },
        {
          path: 'view/:id',
          name: 'glassware-view',
          component: () => import('@/components/glassware/GlasswareSpecific.vue'),
        },
      ],
    },
  ],
})

export default router
