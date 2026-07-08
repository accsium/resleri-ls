import { nextTick } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { resetProgress, startObserving, scanImages } from '../composables/useProgress'

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
// 缓存已解析的 JSON 数据。beforeEnter 触发 fetch 与懒加载 chunk 并行，
// 视图 onMounted 时 preFetch[key] 已就绪或自行 fetch。
async function _prefetch(key, url, parser = 'json') {
  if (_dataCache[key]) return _dataCache[key]
  const signal = getNavigationSignal()
  try {
    const r = await fetch(url, { signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    _dataCache[key] = parser === 'text' ? await r.text() : await r.json()
  } catch {
    // 失败不缓存，下次访问重试
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
    meta: { navKey: 'navGuide' },
  },
  {
    path: '/',
    redirect: '/dex',
  },
  {
    path: '/collection/:code?',
    name: 'collection',
    component: () => import('../views/CollectionView.vue'),
    meta: { navKey: 'navCollection' },
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('../views/SkillListView.vue'),
    meta: { navKey: 'navSkills' },
  },
  {
    path: '/leader-skills',
    name: 'leader-skills',
    component: () => import('../views/LeaderSkillView.vue'),
    meta: { navKey: 'navLeaderSkills' },
  },
  {
    path: '/support-abilities',
    name: 'support-abilities',
    component: () => import('../views/SupportAbilityView.vue'),
    meta: { navKey: 'navSupportAbility' },
  },
  {
    path: '/events',
    name: 'events',
    component: () => import('../views/EventView.vue'),
    beforeEnter: () => { _prefetch('events', 'data/events.json') },
    meta: { navKey: 'navEvents' },
  },
  {
    path: '/contest-rotations',
    name: 'contest-rotations',
    component: () => import('../views/ContestRotationView.vue'),
    beforeEnter: () => { _prefetch('contestRotations', 'data/contest_rotations.json') },
    meta: { navKey: 'navContest' },
  },
  {
    path: '/gachas',
    name: 'gachas',
    component: () => import('../views/GachaView.vue'),
    beforeEnter: () => { _prefetch('gachas', 'data/gachas.json') },
    meta: { navKey: 'navGachas' },
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/TestView.vue'),
    beforeEnter: () => { _prefetch('todo', 'config/todo.md', 'text') },
    meta: { navKey: 'navTest' },
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
  nextTick(() => {
    if (app) scanImages(app)
  })
})


export default router
