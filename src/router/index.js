import { createRouter, createWebHistory } from 'vue-router'
import WikiPage from '../components/WikiPage.vue'

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'WikiPage',
    component: WikiPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router