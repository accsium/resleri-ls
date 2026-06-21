import { createRouter, createWebHashHistory } from 'vue-router'

// ── 数据预取缓存 ──
// beforeEnter 在路由切换时立即触发 fetch，与懒加载 chunk 并行，
// 等视图 onMounted 时数据通常已就绪，消除加载态白屏。
// 每次 _prefetch 调用 abort 前一次，确保旧页面的数据请求不占用连接。
const _cache = {}
let _activeAbort = null

function _prefetch(key, url, parser = 'json') {
  if (_activeAbort) _activeAbort.abort()
  _activeAbort = new AbortController()
  const { signal } = _activeAbort

  if (!_cache[key]) {
    _cache[key] = fetch(url, { signal }).then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return parser === 'text' ? r.text() : r.json()
    }).catch(err => {
      delete _cache[key]
      throw err
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
    // 自定义路由滚动位置恢复：同步返回保存位置，Vue Router 在组件渲染后立即执行
    const saved = scrollPositions[to.name]
    if (saved != null) {
      delete scrollPositions[to.name]
      const el = document.querySelector('.app-content')
      return { top: saved, el: el || undefined, behavior: 'instant' }
    }
    // 新导航同步置顶
    return { top: 0 }
  },
})

router.beforeEach((to, from) => {
  if (from.name) {
    // 每次离开路由时更新滚动位置，覆盖旧值防止无限增长
    scrollPositions[from.name] = window.scrollY || document.querySelector('.app-content')?.scrollTop || 0
  }
})

router.afterEach(() => {
  // 滚动恢复已由 scrollBehavior 同步处理，此处不再异步恢复
})

export default router
