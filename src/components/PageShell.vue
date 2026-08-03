<script setup>
import { onMounted, nextTick } from 'vue'
import AppHeader from './AppHeader.vue'
import NavBar from './NavBar.vue'
import AnnouncementBar from './AnnouncementBar.vue'
import { loadProgress, resetProgress, startObserving, scanImages } from '../composables/useProgress'
import { useBuildInfo } from '../composables/useBuildInfo'

defineProps({ navKey: { type: String, default: '' } })

const { loadBuildTime } = useBuildInfo()
// setup 阶段先于任何子组件 setup/mounted —— 视图的 trackData 必然在其后注册
resetProgress()

onMounted(() => {
  loadBuildTime()
  const app = document.querySelector('.app-content')
  if (app) startObserving(app)
  nextTick(() => { if (app) scanImages(app) })
})
</script>

<template>
  <!-- 全局 SVG defs：CharacterCard 和 AvatarDisplay 共享，避免每张卡片重复定义（与 App.vue 逐字一致） -->
  <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0"><defs>
    <filter id="glow-g" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="25" result="blur"/>
      <feComposite in="blur" in2="SourceGraphic" operator="over"/>
    </filter>
    <linearGradient id="gt-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black"/><stop offset="75%" stop-color="black"/><stop offset="100%" stop-color="white"/>
    </linearGradient>
    <linearGradient id="gl-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="black"/><stop offset="75%" stop-color="black"/><stop offset="100%" stop-color="white"/>
    </linearGradient>
    <linearGradient id="gr-g" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="black"/><stop offset="75%" stop-color="black"/><stop offset="100%" stop-color="white"/>
    </linearGradient>
    <radialGradient id="rg-g" cx="75" cy="60" r="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="white"/><stop offset="50%" stop-color="white"/><stop offset="100%" stop-color="black"/>
    </radialGradient>
    <radialGradient id="rg-r-g" cx="245" cy="60" r="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="white"/><stop offset="50%" stop-color="white"/><stop offset="100%" stop-color="black"/>
    </radialGradient>
    <mask id="mask-g">
      <rect x="40" y="25" width="240" height="275" fill="white"/>
      <rect x="40" y="10" width="240" height="40" fill="url(#gt-g)"/>
      <rect x="25" y="30" width="40" height="280" fill="url(#gl-g)"/>
      <rect x="255" y="30" width="40" height="280" fill="url(#gr-g)"/>
      <polygon points="45,180 160,295 275,180 275,315 45,315" fill="black"/>
      <rect x="35" y="20" width="40" height="40" fill="url(#rg-g)"/>
      <rect x="245" y="20" width="40" height="40" fill="url(#rg-r-g)"/>
    </mask>
  </defs></svg>
  <div class="app-shell">
    <div class="app-top">
      <AppHeader :nav-key="navKey" />
      <div class="load-bar">
        <div class="load-bar-fill" :class="{ complete: loadProgress >= 100 }" :style="{ width: loadProgress + '%' }"></div>
      </div>
      <NavBar />
    </div>
    <AnnouncementBar />
    <div class="app-content">
      <slot />
    </div>
  </div>
</template>
