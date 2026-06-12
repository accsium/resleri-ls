<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import NavBar from './components/NavBar.vue'
import AnnouncementBar from './components/AnnouncementBar.vue'
import { useI18n } from './composables/useI18n'
import { useCharacterData } from './composables/useCharacterData'
import { useBuildInfo } from './composables/useBuildInfo'

const { setLang } = useI18n()
const { loadIndex, loadProgress, indexLoadError } = useCharacterData()
const { loadBuildTime } = useBuildInfo()

onMounted(async () => {
  setLang('cn')
  await loadIndex()
  await loadBuildTime()
})
</script>

<template>
  <div class="app-shell">
    <div class="app-top">
      <AppHeader />
      <div class="load-bar">
        <div class="load-bar-fill" :class="{ complete: loadProgress >= 100 }" :style="{ width: loadProgress + '%' }"></div>
      </div>
      <NavBar />
    </div>
    <AnnouncementBar />
    <div class="app-content">
      <div v-if="indexLoadError" class="load-error">{{ indexLoadError }}</div>
      <router-view v-else />
    </div>
  </div>
</template>

<style scoped>
.load-error {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}
</style>
