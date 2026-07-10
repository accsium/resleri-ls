<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import SortSearchBar from '../components/SortSearchBar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import CharacterGrid from '../components/CharacterGrid.vue'
import { useFilters } from '../composables/useFilters'
import { useCharacterData } from '../composables/useCharacterData'

defineOptions({ name: 'DexView' })

const headRef = ref(null)
const { resetFilters, pagedCharacters } = useFilters()
const { indexLoaded, loadIndex, loadSkills, loadTraits } = useCharacterData()

const isEmpty = computed(() => pagedCharacters.value.length === 0)

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

onMounted(async () => {
  await loadIndex()
  loadTraits()
  loadSkills()
  resetFilters()
  setupObserver()
})

onUnmounted(() => {
  teardownObserver()
  document.documentElement.style.removeProperty('--sticky-head-h')
})
</script>

<template>
  <div class="dex-layout">
    <div ref="headRef" class="dex-sticky-head">
      <FilterBar />
      <SortSearchBar />
      <PaginationBar />
    </div>
    <div v-if="!indexLoaded" class="loading">加载中...</div>
    <template v-else>
      <CharacterGrid />
      <div v-if="isEmpty" class="no-data">没有匹配的角色</div>
    </template>
  </div>
</template>
