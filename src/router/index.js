import { createRouter, createWebHashHistory } from 'vue-router'
import { resetProgress, startObserving } from '../composables/useProgress'

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
    }).catch(() => { delete _dataCache[key] })
  }
  return _dataCache[key]
}

export const preFetch = new Proxy({}, {
  get(_, key) { return _dataCache[key] || null },
})

const routes = [
  {
    path: '/dex',
    name: 'dex',
    component: () => import('../views/DexView.vue'),
  },
  {
    path: '/',
    redirect: '/dex',
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

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.afterEach(() => {
  const app = document.querySelector('.app-content')
  if (app) app.scrollTop = 0
})

router.beforeEach((to, from) => {
  // 切换路由时 abort 所有旧请求，创建新 scope
  if (_navigationScope) _navigationScope.abort()
  _navigationScope = new AbortController()
  resetProgress()
  const app = document.querySelector('.app-content')
  if (app) startObserving(app)
})


export default router
