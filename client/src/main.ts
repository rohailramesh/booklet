import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { authentication } from '@/plugins/authentication'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import App from './App.vue'
import router from './router'

// --------------------
// Create app
// --------------------
const app = createApp(App)

// --------------------
// Create Pinia FIRST
// --------------------
const pinia = createPinia()
app.use(pinia)

// --------------------
// Vuetify
// --------------------
const vuetify = createVuetify({
  theme: { defaultTheme: 'dark' },
  components,
  directives
})
app.use(vuetify)

// --------------------
// Auth bootstrap (IMPORTANT)
// --------------------
authentication.install(pinia).then(() => {
  app.use(router)
  app.mount('#app')
})
