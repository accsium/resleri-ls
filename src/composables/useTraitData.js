import { ref } from 'vue'
import { getNavigationSignal } from '../router'

// 模块级缓存：所有消费者共享同一份数据
const battleTraits = ref([])
const equipTraits = ref([])
const loaded = ref(false)
const error = ref(null)
let cachePromise = null

export function useTraitData() {
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
