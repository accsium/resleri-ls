<script setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
const current = location.pathname.split('/').pop() || ''
</script>

<template>
  <div class="nav-bar">
    <nav class="nav-links">
      <a href="./dex.html" class="nav-link" :class="{ 'router-link-active': current === 'dex.html' }">{{ t('navGuide') }}</a>
      <a href="./collection.html" class="nav-link" :class="{ 'router-link-active': current === 'collection.html' }">{{ t('navCollection') }}</a>
      <a href="./skills.html" class="nav-link" :class="{ 'router-link-active': current === 'skills.html' }">{{ t('navSkills') }}</a>
      <a href="./leader-skills.html" class="nav-link" :class="{ 'router-link-active': current === 'leader-skills.html' }">{{ t('navLeaderSkills') }}</a>
      <a href="./support-abilities.html" class="nav-link" :class="{ 'router-link-active': current === 'support-abilities.html' }">{{ t('navSupportAbility') }}</a>
      <a href="./events.html" class="nav-link" :class="{ 'router-link-active': current === 'events.html' }">{{ t('navEvents') }}</a>
      <a href="./contest-rotations.html" class="nav-link" :class="{ 'router-link-active': current === 'contest-rotations.html' }">{{ t('navContest') }}</a>
      <a href="./gachas.html" class="nav-link" :class="{ 'router-link-active': current === 'gachas.html' }">{{ t('navGachas') }}</a>
      <a href="./test.html" class="nav-link" :class="{ 'router-link-active': current === 'test.html' }">{{ t('navTest') }}</a>
    </nav>
  </div>
</template>
