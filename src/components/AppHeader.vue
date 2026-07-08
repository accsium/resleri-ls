<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useBuildInfo } from '../composables/useBuildInfo'

const { currentLang, t, setLang } = useI18n()
const { updateTimeText } = useBuildInfo()
const route = useRoute()
const menuOpen = ref(false)

function handleRefresh() {
  if (!confirm(t('confirmRefresh'))) return
  const url = new URL(window.location.href)
  url.searchParams.set('_t', Date.now())
  window.location.href = url.toString()
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <div class="header">
    <div class="header-top">
      <span class="hamburger-btn" @click="menuOpen = !menuOpen">
        <span></span><span></span><span></span>
      </span>
      <div class="header-center">
        <h1>{{ t('pageTitle') }}</h1>
        <div class="header-page-name">{{ route.meta?.navKey ? t(route.meta.navKey) : '' }}</div>
      </div>
      <div class="lang-switcher">
        <button
          class="lang-btn"
          :class="{ active: currentLang === 'ja' }"
          @click="setLang('ja')"
        >日</button>
        <button
          class="lang-btn"
          :class="{ active: currentLang === 'cn' }"
          @click="setLang('cn')"
        >中</button>
        <button class="btn-refresh" @click="handleRefresh">强制刷新</button>
      </div>
    </div>
    <div class="update-time">{{ updateTimeText }}</div>
  </div>

  <!-- 移动端侧边栏 -->
  <div v-if="menuOpen" class="menu-overlay" @click="closeMenu"></div>
  <div class="menu-sidebar" :class="{ open: menuOpen }">
    <router-link to="/dex" class="nav-link" @click="closeMenu">{{ t('navGuide') }}</router-link>
    <router-link to="/collection" class="nav-link" @click="closeMenu">{{ t('navCollection') }}</router-link>
    <router-link to="/skills" class="nav-link" @click="closeMenu">{{ t('navSkills') }}</router-link>
    <router-link to="/leader-skills" class="nav-link" @click="closeMenu">{{ t('navLeaderSkills') }}</router-link>
    <router-link to="/support-abilities" class="nav-link" @click="closeMenu">{{ t('navSupportAbility') }}</router-link>
    <router-link to="/events" class="nav-link" @click="closeMenu">{{ t('navEvents') }}</router-link>
    <router-link to="/contest-rotations" class="nav-link" @click="closeMenu">{{ t('navContest') }}</router-link>
    <router-link to="/gachas" class="nav-link" @click="closeMenu">{{ t('navGachas') }}</router-link>
    <router-link to="/test" class="nav-link" @click="closeMenu">{{ t('navTest') }}</router-link>
  </div>
</template>
