<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useBuildInfo } from '../composables/useBuildInfo'

defineProps({ navKey: { type: String, default: '' } })

const { currentLang, t, setLang } = useI18n()
const { updateTimeText } = useBuildInfo()
const current = location.pathname.split('/').pop() || ''
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
        <div class="header-page-name">{{ navKey ? t(navKey) : '' }}</div>
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
    <a href="./dex.html" class="nav-link" :class="{ 'router-link-active': current === 'dex.html' }" @click="closeMenu">{{ t('navGuide') }}</a>
    <a href="./collection.html" class="nav-link" :class="{ 'router-link-active': current === 'collection.html' }" @click="closeMenu">{{ t('navCollection') }}</a>
    <a href="./skills.html" class="nav-link" :class="{ 'router-link-active': current === 'skills.html' }" @click="closeMenu">{{ t('navSkills') }}</a>
    <a href="./leader-skills.html" class="nav-link" :class="{ 'router-link-active': current === 'leader-skills.html' }" @click="closeMenu">{{ t('navLeaderSkills') }}</a>
    <a href="./support-abilities.html" class="nav-link" :class="{ 'router-link-active': current === 'support-abilities.html' }" @click="closeMenu">{{ t('navSupportAbility') }}</a>
    <a href="./events.html" class="nav-link" :class="{ 'router-link-active': current === 'events.html' }" @click="closeMenu">{{ t('navEvents') }}</a>
    <a href="./contest-rotations.html" class="nav-link" :class="{ 'router-link-active': current === 'contest-rotations.html' }" @click="closeMenu">{{ t('navContest') }}</a>
    <a href="./gachas.html" class="nav-link" :class="{ 'router-link-active': current === 'gachas.html' }" @click="closeMenu">{{ t('navGachas') }}</a>
    <a href="./test.html" class="nav-link" :class="{ 'router-link-active': current === 'test.html' }" @click="closeMenu">{{ t('navTest') }}</a>
  </div>
</template>
