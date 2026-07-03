import { ref, computed } from 'vue'

const _total = ref(0)
const _loaded = ref(0)

export const loadProgress = computed(() => {
  if (_total.value === 0) return 100
  return Math.min(100, Math.round(_loaded.value / _total.value * 100))
})

export function resetProgress() {
  _total.value = 0
  _loaded.value = 0
}

// 注册一项数据加载。cached=true 立即计完成，返回 done 回调。
export function trackData(cached) {
  _total.value++
  if (cached) { _loaded.value++; return () => {} }
  let done = false
  return () => { if (!done) { done = true; _loaded.value++ } }
}

// ── 图片追踪 ──
let _observer = null

function _trackImg(img) {
  if (img.dataset.progressTracked) return
  img.dataset.progressTracked = '1'
  _total.value++
  if (img.complete) { _loaded.value++; return }
  img.addEventListener('load', () => _loaded.value++, { once: true })
  img.addEventListener('error', () => _loaded.value++, { once: true })
}

export function startObserving(container) {
  if (_observer) _observer.disconnect()
  // 扫描已有 img
  container.querySelectorAll('img').forEach(_trackImg)
  // 监听新增
  _observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.tagName === 'IMG') _trackImg(node)
        if (node.querySelectorAll) node.querySelectorAll('img').forEach(_trackImg)
      }
    }
  })
  _observer.observe(container, { childList: true, subtree: true })
}

export function scanImages(container) {
  container.querySelectorAll('img').forEach(_trackImg)
}
