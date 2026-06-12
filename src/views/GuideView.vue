<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import SortSearchBar from '../components/SortSearchBar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import CharacterGrid from '../components/CharacterGrid.vue'
import { useFilters } from '../composables/useFilters'

const headRef = ref(null)
const { resetFilters } = useFilters()

onMounted(() => {
  resetFilters()
  const el = headRef.value
  if (!el) return
  const update = () => {
    document.documentElement.style.setProperty('--sticky-head-h', el.offsetHeight + 'px')
  }
  update()
  const ro = new ResizeObserver(update)
  ro.observe(el)
  onUnmounted(() => {
    ro.disconnect()
    document.documentElement.style.removeProperty('--sticky-head-h')
  })
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
