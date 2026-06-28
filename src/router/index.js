import { createRouter, createWebHashHistory } from 'vue-router'

// ── 导航作用域 ──
// 每次路由切换 abort 所有旧请求，新请求绑定新 scope。
// 数据缓存独立于请求——回到旧页数据立即可用，不保留请求。
// 覆盖所有离开方式：router-link、router.push、浏览器前进后退。
const _dataCache = {}
let _navigationScope = null

export function getNavigationSignal() {
  return _navigationScope?.signal || null
}

// ── 数据预取 ──
// 缓存 fetch Promise（resolve 后为已解析 JSON）。beforeEnter 触发 fetch 与懒加载 chunk 并行，
// 视图 onMounted 时 await preFetch[key] 已就绪或自行 fetch。
function _prefetch(key, url, parser = 'json') {
  const signal = getNavigationSignal()
  if (!_dataCache[key]) {
    _dataCache[key] = fetch(url, { signal }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return parser === 'text' ? r.text() : r.json()
    }).catch(err => { delete _dataCache[key]; throw err })
  }
  return _dataCache[key]
}

export const preFetch = new Proxy({}, {
  get(_, key) { return _dataCache[key] || null },
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
  // 切换路由时 abort 所有旧请求，创建新 scope
  if (_navigationScope) _navigationScope.abort()
  _navigationScope = new AbortController()

  if (from.name) {
    scrollPositions[from.name] = window.scrollY || document.querySelector('.app-content')?.scrollTop || 0
  }
})

router.afterEach(() => {
  // 滚动恢复已由 scrollBehavior 同步处理，此处不再异步恢复
})

export default router
