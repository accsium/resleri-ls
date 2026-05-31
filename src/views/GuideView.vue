<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SortFilterBar from '../components/SortFilterBar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import CharacterGrid from '../components/CharacterGrid.vue'

const headRef = ref(null)

onMounted(() => {
  const el = headRef.value
  if (!el) return
  const update = () => {
    document.documentElement.style.setProperty('--sticky-head-h', el.offsetHeight + 'px')
  }
  update()
  const ro = new ResizeObserver(update)
  ro.observe(el)
  onUnmounted(() => ro.disconnect())
})
</script>

<template>
  <div class="guide-layout">
    <div ref="headRef" class="guide-sticky-head">
      <SortFilterBar />
      <PaginationBar />
    </div>
    <CharacterGrid />
  </div>
</template>
