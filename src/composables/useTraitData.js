import { ref } from 'vue'
import { getNavigationSignal } from '../router'

// 模块级缓存：同源数据只请求一次
let cachePromise = null

/**
 * 共享词条数据（battle_tool_trait + equipment_tool_trait）
 * FilterBar 和 SynthesisModule 共用，避免重复 fetch
 */
export function useTraitData() {
  const battleTraits = ref([])
  const equipTraits = ref([])
  const loaded = ref(false)
  const error = ref(null)

  async function load() {
    if (loaded.value) return
    if (cachePromise) {
      const result = await cachePromise
      battleTraits.value = result[0]
      equipTraits.value = result[1]
      loaded.value = true
      return
    }
    try {
      const signal = getNavigationSignal()
      cachePromise = Promise.all([
        fetch('data/battle_tool_trait.json', { signal }).then(r => r.json()),
        fetch('data/equipment_tool_trait.json', { signal }).then(r => r.json()),
      ])
      const [bt, et] = await cachePromise
      battleTraits.value = bt
      equipTraits.value = et
      error.value = null
      loaded.value = true
    } catch (e) {
      if (e.name === 'AbortError') { cachePromise = null; return }
      error.value = e
      cachePromise = null
      console.error('加载词条数据失败', e)
    }
  }

  return { battleTraits, equipTraits, loaded, error, load }
}
