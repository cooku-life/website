import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import WikiPage from '../components/WikiPage.vue'

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'WikiPage',
    component: WikiPage
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router