<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { replaceEffects } from '../utils/effects.js'

const props = defineProps({
  skillType: Object,
})

const { t, getField } = useI18n()

const activeIndex = ref(props.skillType.levels.length - 1)

watch(() => props.skillType, () => {
  activeIndex.value = props.skillType.levels.length - 1
})

const currentSkill = computed(() => props.skillType.levels[activeIndex.value] || {})

const skillName = computed(() => currentSkill.value.name || '??')
const skillId = computed(() => currentSkill.value.id || '')
const hasLevels = computed(() => props.skillType.type !== 'leader' && props.skillType.levels.length > 1)

const skillStats = computed(() => {
  const skill = currentSkill.value
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?'
  const attributeNames = (skill.attack_attributes || []).map(a => {
    const map = { 1: '斬', 2: '打', 3: '突', 5: '火', 6: '氷', 7: '雷', 8: '風' }
    return map[a] || a
  })
  const attr = attributeNames.join('/')
  const desc = replaceEffects(skill.description, skill.effects)
  const wt = 200 + (skill.wait ?? 0)
  return { target, attr, desc, wt }
})
</script>

<template>
  <div class="skill-group" :data-group="skillType.type">
    <div class="subsection-title">{{ skillType.name }}</div>
    <div class="banner-title">
      <span>{{ skillName }} <small>(ID:{{ skillId }})</small></span>
      <div v-if="hasLevels" class="level-tabs">
        <button
          v-for="(s, i) in skillType.levels"
          :key="i"
          class="level-tab"
          :class="{ active: i === activeIndex }"
          @click="activeIndex = i"
        >{{ t('level') }}{{ i + 1 }}</button>
      </div>
    </div>
    <div class="content-block">
      <template v-if="skillType.type === 'leader'">
        <div class="skill-desc" v-html="currentSkill.description || ''"></div>
      </template>
      <template v-else>
        <div class="skill-desc" v-html="skillStats.desc"></div>
        <div class="skill-stats">
          <span class="skill-stat">{{ t('target') }}: {{ skillStats.target }}</span>
          <span v-if="skillStats.attr" class="skill-stat">{{ t('attribute') }}: {{ skillStats.attr }}</span>
          <span class="skill-stat">{{ t('power') }}: {{ currentSkill.power ?? 0 }}%</span>
          <span class="skill-stat">{{ t('break') }}: {{ currentSkill.break_power ?? 0 }}%</span>
          <span class="skill-stat">{{ t('wt') }}: {{ skillStats.wt }}</span>
          <span class="skill-stat">{{ t('limit') }}: {{ currentSkill.limit_count ?? '—' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
