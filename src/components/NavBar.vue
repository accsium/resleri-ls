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
      <router-link to="/support-abilities" class="nav-link">{{ t('navSupportAbility') }}</router-link>
      <router-link to="/events" class="nav-link">{{ t('navEvents') }}</router-link>
      <router-link to="/contest-rotations" class="nav-link">{{ t('navContest') }}</router-link>
      <router-link to="/test" class="nav-link">{{ t('navTest') }}</router-link>
    </nav>
  </div>
</template>
