<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import NavBar from './components/NavBar.vue'
import AnnouncementBar from './components/AnnouncementBar.vue'
import { useI18n } from './composables/useI18n'
import { useCharacterData } from './composables/useCharacterData'
import { useBuildInfo } from './composables/useBuildInfo'

const { setLang } = useI18n()
const { loadIndex, loadProgress } = useCharacterData()
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
        <div class="load-bar-fill" :style="{ width: loadProgress + '%' }"></div>
      </div>
      <NavBar />
    </div>
    <AnnouncementBar />
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>
