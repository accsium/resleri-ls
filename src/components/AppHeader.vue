<script setup>
import { useI18n } from '../composables/useI18n'
import { useBuildInfo } from '../composables/useBuildInfo'

const { currentLang, t, setLang } = useI18n()
const { updateTimeText } = useBuildInfo()

function handleRefresh() {
  if (confirm('确定要清除缓存并刷新数据？')) location.reload(true)
}
</script>

<template>
  <div class="header">
    <div class="header-top">
      <h1>{{ t('pageTitle') }}</h1>
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
</template>
