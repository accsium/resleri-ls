<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import SortSearchBar from '../components/SortSearchBar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import CharacterGrid from '../components/CharacterGrid.vue'
import { useFilters } from '../composables/useFilters'

defineOptions({ name: 'GuideView' })

const headRef = ref(null)
const { resetFilters } = useFilters()

let ro = null

function setupObserver() {
  if (ro) return // 已存在则复用
  const el = headRef.value
  if (!el) return
  const update = () => {
    document.documentElement.style.setProperty('--sticky-head-h', el.offsetHeight + 'px')
  }
  update()
  ro = new ResizeObserver(update)
  ro.observe(el)
}

function teardownObserver() {
  if (ro) {
    ro.disconnect()
    ro = null
  }
}

onMounted(() => {
  // 首次挂载时重置筛选 + 建立 observer
  resetFilters()
  setupObserver()
})

onActivated(() => {
  // KeepAlive 重新激活：重置筛选 + 重建 observer（DOM 已重新插入文档）
  resetFilters()
  setupObserver()
})

onDeactivated(() => {
  // KeepAlive 停用时断开 observer（DOM 已移出文档）
  teardownObserver()
})

onUnmounted(() => {
  teardownObserver()
  document.documentElement.style.removeProperty('--sticky-head-h')
})
</script>

<template>
  <div class="guide-layout">
    <div ref="headRef" class="guide-sticky-head">
      <FilterBar />
      <SortSearchBar />
      <PaginationBar />
    </div>
    <CharacterGrid />
  </div>
</template>
