import { ref, computed } from 'vue'
import { useShareCode } from './useShareCode'
import { useCharacterData } from './useCharacterData'

const STORAGE_KEY = 'resleri-collection'

const ownedIds = ref(new Set())

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && data.version === 1 && Array.isArray(data.owned)) {
        ownedIds.value = new Set(data.owned)
        return
      }
    }
  } catch { /* corrupted data, use empty */ }
  ownedIds.value = new Set()
}

// 模块加载时从 localStorage 读取
loadFromStorage()

export function useCollection() {
  const { characterIndex } = useCharacterData()
  const { encodeShareCode, decodeShareCode } = useShareCode()

  const ownedCount = computed(() => ownedIds.value.size)

  const shareCode = computed(() => {
    if (characterIndex.value.length === 0) return ''
    return encodeShareCode([...ownedIds.value], characterIndex.value)
  })

  function isOwned(id) {
    return ownedIds.value.has(id)
  }

  function toggleOwned(id) {
    const next = new Set(ownedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    ownedIds.value = next
  }

  function saveToStorage() {
    const data = {
      version: 1,
      owned: [...ownedIds.value],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  // 用分享码覆盖当前内存状态（不写入 localStorage）
  function loadFromCode(code, chars) {
    const decoded = decodeShareCode(code, chars)
    if (decoded) {
      ownedIds.value = new Set(decoded)
      return true
    }
    return false
  }

  // 直接设置拥有的 ID 集合
  function setOwnedIds(ids) {
    ownedIds.value = new Set(ids)
  }

  return {
    ownedIds,
    ownedCount,
    shareCode,
    isOwned,
    toggleOwned,
    saveToStorage,
    loadFromStorage,
    loadFromCode,
    setOwnedIds,
    decodeShareCode,
  }
}
