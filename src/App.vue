<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import NavBar from './components/NavBar.vue'
import AnnouncementBar from './components/AnnouncementBar.vue'
import { useI18n } from './composables/useI18n'
import { useCharacterData } from './composables/useCharacterData'
import { useBuildInfo } from './composables/useBuildInfo'

const { setLang } = useI18n()
const { loadIndex, loadProgress, indexLoadError, indexLoaded } = useCharacterData()
const { loadBuildTime } = useBuildInfo()

// KeepAlive 缓存 GuideView + CollectionView，避免导航时全量重建 DOM
const keepAliveViews = ['GuideView', 'CollectionView']

onMounted(async () => {
  setLang('cn')
  await Promise.all([loadIndex(), loadBuildTime()])
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
      <div v-else-if="!indexLoaded" class="load-error">加载角色数据中...</div>
      <router-view v-else v-slot="{ Component }">
        <Transition name="page-fade">
          <KeepAlive :include="keepAliveViews">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.load-error {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* 页面切换过渡：轻量 fade 缓解感知延迟 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.12s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
