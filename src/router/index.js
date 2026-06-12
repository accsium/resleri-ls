import { createRouter, createWebHashHistory } from 'vue-router'

// ── 数据预取缓存 ──
// beforeEnter 在路由切换时立即触发 fetch，与懒加载 chunk 并行，
// 等视图 onMounted 时数据通常已就绪，消除加载态白屏。
const _cache = {}

function _prefetch(key, url, parser = 'json') {
  if (!_cache[key]) {
    _cache[key] = fetch(url).then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return parser === 'text' ? r.text() : r.json()
    })
  }
  return _cache[key]
}

/** 视图通过此访问预取数据：await preFetch[key]，若 beforeEnter 未触发则 fallback 自行 fetch */
export const preFetch = new Proxy({}, {
  get(_, key) { return _cache[key] || null },
})

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
    beforeEnter: () => { _prefetch('skills', 'data/skills.json') },
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
    beforeEnter: () => { _prefetch('events', 'data/events.json') },
  },
  {
    path: '/contest-rotations',
    name: 'contest-rotations',
    component: () => import('../views/ContestRotationView.vue'),
    beforeEnter: () => { _prefetch('contestRotations', 'data/contest_rotations.json') },
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/TestView.vue'),
    beforeEnter: () => { _prefetch('todo', 'config/todo.md', 'text') },
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
    // 使用 rAF 在浏览器绘制前恢复滚动，避免 setTimeout(0) 的顶部闪烁
    requestAnimationFrame(() => {
      const el = document.querySelector('.app-content')
      if (el) el.scrollTop = saved
      else window.scrollTo(0, saved)
    })
    delete scrollPositions[to.name]
  }
})

export default router
