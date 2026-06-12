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
    path: '/support-abilities',
    name: 'support-abilities',
    component: () => import('../views/SupportAbilityView.vue'),
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

// 记录每个路由的滚动位置，返回时还原
const scrollPositions = {}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 浏览器前进后退
    if (savedPosition) return savedPosition
    // 自定义路由滚动位置恢复（由 afterEach 异步处理，等组件渲染完成）
    if (scrollPositions[to.name] != null) return false
    // 新导航同步置顶，避免异步滚动造成的视觉闪烁
    return { top: 0 }
  },
})

router.beforeEach((to, from) => {
  if (from.name) {
    // 每次离开路由时更新滚动位置，覆盖旧值防止无限增长
    scrollPositions[from.name] = window.scrollY || document.querySelector('.app-content')?.scrollTop || 0
  }
})

router.afterEach((to) => {
  const saved = scrollPositions[to.name]
  if (saved != null) {
    const el = document.querySelector('.app-content')
    setTimeout(() => {
      if (el) el.scrollTop = saved
      else window.scrollTo(0, saved)
    }, 0)
    delete scrollPositions[to.name]
  }
})

export default router
