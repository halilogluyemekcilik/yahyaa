// Global stiller (Less) yüklensin
import './assets/main.less'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Vue uygulamasını oluştur
const app = createApp(App)

// Durum yönetimi (Pinia) ve yönlendirme (Router) eklentilerini uygula
app.use(createPinia())
app.use(router)

// #app kök elemanına mount et
app.mount('#app')
