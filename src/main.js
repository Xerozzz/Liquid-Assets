import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { RosePreset } from './theme'

import App from './App.vue'
import router from './router'
import { getAuthToken, clearAuthToken } from './auth'

import 'primeicons/primeicons.css'
import './index.css'
import './assets/main.css'

// Attach the stored Basic Auth token to every API call, and surface a 401 (bad/expired
// credentials) so App.vue can re-show the login screen.
const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : (input && input.url) || ''
  const isApi = url.includes('/api/')
  if (isApi) {
    const token = getAuthToken()
    if (token) {
      init = { ...init, headers: { ...(init.headers || {}), Authorization: `Basic ${token}` } }
    }
  }
  const res = await originalFetch(input, init)
  if (isApi && res.status === 401) {
    clearAuthToken()
    window.dispatchEvent(new CustomEvent('auth-required'))
  }
  return res
}

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: RosePreset,
  },
})

app.use(createPinia())
app.use(router)

app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
