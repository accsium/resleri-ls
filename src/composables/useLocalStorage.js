import { ref, watch } from 'vue'

const keyRefs = new Map()

// 跨标签页同步：监听其他标签页的 localStorage 变更
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && keyRefs.has(e.key)) {
      try {
        keyRefs.get(e.key).value = e.newValue != null ? JSON.parse(e.newValue) : null
      } catch {}
    }
  })
}

/**
 * 与 localStorage 双向同步的 ref
 * @param {string} key      localStorage 键名
 * @param {*}      defaultValue  默认值
 * @returns {import('vue').Ref}
 */
export function useLocalStorage(key, defaultValue) {
  let initial = defaultValue
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) initial = JSON.parse(raw)
  } catch {}

  const val = ref(initial)

  // 注册跨标签页同步
  keyRefs.set(key, val)

  watch(val, (v) => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {}
  }, { deep: true })

  return val
}
