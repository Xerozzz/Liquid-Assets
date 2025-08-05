import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primeuix/themes/aura';

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
    Textarea,
    Toast,
    Divider,
    FloatLabel,
    Panel,
    ProgressSpinner,
} from 'primevue';


import App from './App.vue'
import router from './router'

import './index.css'
import './assets/main.css'
const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

app.use(createPinia())
app.use(router)

app.component('InputText', InputText);
app.component('Button', Button);
app.component('IftaLabel', IftaLabel);
app.component('InputText', InputText);
app.component('Tabs', Tabs);
app.component('Tab', Tab);
app.component('TabList', TabList);
app.component('TabPanels', TabPanels);
app.component('TabPanel', TabPanel);
app.component('Textarea', Textarea);
app.component('Card', Card);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('AccordionContent', AccordionContent);
app.component('Accordion', Accordion);
app.component('AccordionPanel', AccordionPanel);
app.component('AccordionHeader', AccordionHeader);
app.component('Toast', Toast);
app.component('Divider', Divider);
app.component('FloatLabel', FloatLabel);
app.component('Panel', Panel);
app.component('ProgressSpinner', ProgressSpinner);
app.use(ToastService);

app.mount('#app')
