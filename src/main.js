import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';

import {
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Button,
    Card,
    Column,
    DataTable,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    InputText,
    IftaLabel,
    Textarea
} from 'primevue';


import App from './App.vue'
import router from './router'

import './index.css'
import './assets/main.css'
const app = createApp(App)
app.use(PrimeVue, {
    unstyled: true
});

app.use(createPinia())
app.use(router)

app.component('InputText', InputText);

app.mount('#app')
