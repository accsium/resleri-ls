import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'guide',
    component: () => import('../views/GuideView.vue'),
  },
  {
    path: '/collection/:code?',
    name: 'collection',
    component: () => import('../views/CollectionView.vue'),
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('../views/SkillListView.vue'),
  },
  {
    path: '/leader-skills',
    name: 'leader-skills',
    component: () => import('../views/LeaderSkillView.vue'),
  },
  {
    path: '/events',
    name: 'events',
    component: () => import('../views/EventView.vue'),
  },
  {
    path: '/contest-rotations',
    name: 'contest-rotations',
    component: () => import('../views/ContestRotationView.vue'),
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/TestView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
