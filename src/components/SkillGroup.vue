<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { replaceEffects } from '../utils/effects.js'
import IconDisplay from './IconDisplay.vue'

const props = defineProps({
  skillType: Object,
})

const { t, getField, ATTR_MAP, ATTR_MAP_CN, currentLang } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)

const activeIndex = ref(props.skillType.levels.length - 1)

watch(() => props.skillType, () => {
  activeIndex.value = props.skillType.levels.length - 1
})

const currentSkill = computed(() => props.skillType.levels[activeIndex.value] || {})

const skillName = computed(() => currentSkill.value.name || '??')
const skillId = computed(() => currentSkill.value.id || '')
const skillAttrs = computed(() => currentSkill.value.attack_attributes || [])
const hasLevels = computed(() => props.skillType.type !== 'leader' && props.skillType.levels.length > 1)

const skillStats = computed(() => {
  const skill = currentSkill.value
  const target = getField(skill, 'target_name') || skill.skill_target_type || '?'
  const attributeNames = (skill.attack_attributes || []).map(a => {
    return attrMap.value[a] || a
  })
  const attr = attributeNames.join('/')
  const desc = replaceEffects(skill.description, skill.effects)
  const wt = 200 + (skill.wait ?? 0)
  return { target, attr, desc, wt }
})

const leaderSkillDesc = computed(() => {
  const skill = currentSkill.value
  return replaceEffects(skill.description, skill.effects)
})
</script>

<template>
  <div class="skill-group" :data-group="skillType.type">
    <div class="subsection-title">{{ skillType.name }}</div>
    <div class="banner-title">
      <span style="display:inline-flex;align-items:center;gap:3px;height:1em;overflow:visible;">
        <IconDisplay v-for="aid in skillAttrs" :key="aid" type="attribute" :id="aid" :size="24" />
        <span>{{ skillName }} <small v-if="skillId">(ID:{{ skillId }})</small></span>
      </span>
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
        <div class="skill-desc" v-html="leaderSkillDesc"></div>
      </template>
      <template v-else>
        <div class="skill-desc" v-html="skillStats.desc"></div>
        <div class="skill-stats">
          <span class="skill-stat">{{ t('target') }}: {{ skillStats.target }}</span>
          <span v-if="skillStats.attr" class="skill-stat">{{ t('attribute') }}: {{ skillStats.attr }}</span>
          <!-- power=0 在游戏中不存在，|| 将 0 视为无值显示「—」是有意设计 -->
          <span class="skill-stat">{{ t('dmgPower') }}: {{ [1,2,3,4].includes(currentSkill.skill_power_type) && currentSkill.power ? currentSkill.power : '—' }}{{ [1,2,3,4].includes(currentSkill.skill_power_type) && currentSkill.power ? '%' : '' }}</span>
          <span class="skill-stat">{{ t('breakPower') }}: {{ currentSkill.break_power || '—' }}{{ currentSkill.break_power ? '%' : '' }}</span>
          <span class="skill-stat">{{ t('healPower') }}: {{ [5,6,7].includes(currentSkill.skill_power_type) && currentSkill.power ? currentSkill.power : '—' }}{{ [5,6,7].includes(currentSkill.skill_power_type) && currentSkill.power ? '%' : '' }}</span>
          <span class="skill-stat">{{ t('wt') }}: {{ skillStats.wt }}</span>
          <span class="skill-stat">{{ t('limit') }}: {{ currentSkill.limit_count ?? '—' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
