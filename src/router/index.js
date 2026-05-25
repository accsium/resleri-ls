import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'guide',
    component: () => import('../views/GuideView.vue'),
  },
  {
    path: '/collection',
    name: 'collection',
    component: () => import('../views/CollectionView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
