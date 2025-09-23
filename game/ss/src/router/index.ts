import { createRouter, createWebHistory } from 'vue-router'
import AppVue from '@/App.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // Tek sayfa: ana rota doğrudan App.vue'yi render eder
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppVue
    },
  ]
})

export default router
