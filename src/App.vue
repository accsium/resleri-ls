<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import NavBar from './components/NavBar.vue'
import { useI18n } from './composables/useI18n'
import { useCharacterData } from './composables/useCharacterData'
import { useBuildInfo } from './composables/useBuildInfo'

const { setLang } = useI18n()
const { loadIndex } = useCharacterData()
const { loadBuildTime } = useBuildInfo()

onMounted(async () => {
  setLang('cn')
  await loadIndex()
  await loadBuildTime()
})
</script>

<template>
  <AppHeader />
  <NavBar />
  <router-view />
</template>
