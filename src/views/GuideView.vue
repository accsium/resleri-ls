<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import ControlsBar from '../components/ControlsBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import CharacterGrid from '../components/CharacterGrid.vue'

const { currentLang } = useI18n()
const showFilter = ref(false)

watch(currentLang, () => {
  showFilter.value = false
})
</script>

<template>
  <ControlsBar @toggle-filter="showFilter = !showFilter" />
  <FilterPanel v-if="showFilter" @close="showFilter = false" />
  <CharacterGrid />
</template>
