import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { RosePreset } from './theme'

import App from './App.vue'
import router from './router'

import './index.css'
import './assets/main.css'
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
