<script setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="nav-bar">
    <nav class="nav-links">
      <router-link to="/" class="nav-link">{{ t('navGuide') }}</router-link>
      <router-link to="/collection" class="nav-link">{{ t('navCollection') }}</router-link>
      <router-link to="/skills" class="nav-link">{{ t('navSkills') }}</router-link>
      <router-link to="/leader-skills" class="nav-link">{{ t('navLeaderSkills') }}</router-link>
      <router-link to="/test" class="nav-link">Test</router-link>
    </nav>
  </div>
</template>
