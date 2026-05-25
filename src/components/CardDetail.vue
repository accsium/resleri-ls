<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import SkillGroup from './SkillGroup.vue'
import AbilityCard from './AbilityCard.vue'
import SupportAbilitySection from './SupportAbilitySection.vue'
import SynthesisModule from './SynthesisModule.vue'

const props = defineProps({
  characterData: Object,
  cardState: Object,
  characterId: Number,
})

const { t } = useI18n()

const activeChar = computed(() => {
  if (props.cardState.showTransform && props.characterData._transform) {
    return props.characterData._transform
  }
  return props.characterData
})

const rangeGroup = computed(() => activeChar.value._rangeSkills?.['inrange'] || null)

const allSkillTypes = computed(() => {
  const types = []
  const char = activeChar.value
  const evo = props.cardState.evo
  const range = props.cardState.range

  if (char.leader_skill) {
    types.push({ type: 'leader', name: t('leaderSkillSection'), levels: [char.leader_skill] })
  }

  const skills = char._skills || []
  const activeLevels = []
  skills.forEach(group => {
    if (group.type.startsWith('active')) {
      let levels = evo === 'post' ? group.post_evolution : group.pre_evolution
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution
      if (levels && levels.length > 0) activeLevels.push(...levels)
    }
  })
  if (activeLevels.length > 0) {
    types.push({ type: 'active', name: t('skillType').active, levels: activeLevels })
  }

  const typeText = t('skillType')
  skills.forEach(group => {
    if (group.type === 'normal1' || group.type === 'normal2' || group.type === 'burst') {
      let levels = []
      if (range === 'inrange' && rangeGroup.value) {
        if (group.type === 'normal1') levels = rangeGroup.value.skill1 || []
        else if (group.type === 'normal2') levels = rangeGroup.value.skill2 || []
        else levels = evo === 'post' ? group.post_evolution : group.pre_evolution
      } else {
        levels = evo === 'post' ? group.post_evolution : group.pre_evolution
      }
      if (!levels || levels.length === 0) levels = group.post_evolution.length > 0 ? group.post_evolution : group.pre_evolution
      if (levels && levels.length > 0) {
        types.push({ type: group.type, name: typeText[group.type] || group.type, levels })
      }
    }
  })

  const exSkills = char._exSkills || []
  if (exSkills.length > 0) {
    types.push({ type: 'extra', name: t('skillType').extra, levels: exSkills })
  }

  return types
})

const abilityMap = computed(() => activeChar.value._skillDetails || {})

const evolvedIds = computed(() => {
  const ids = activeChar.value.all_skill_evolved_ability_ids || []
  return new Set(ids)
})

const normalAbilityIds = computed(() => {
  return (activeChar.value.ability_ids || []).filter(id => !evolvedIds.value.has(id))
})

const evoAbilityIds = computed(() => {
  return props.cardState.evo === 'post' ? (activeChar.value.all_skill_evolved_ability_ids || []) : []
})

const allAbilityIds = computed(() => [...new Set([...normalAbilityIds.value, ...evoAbilityIds.value])])

const abilities = computed(() => allAbilityIds.value.map(id => abilityMap.value[id]).filter(Boolean))

const supportIds = computed(() => activeChar.value.support_ability_ids || [])

const skillsCollapsed = ref(false)
const abilitiesCollapsed = ref(false)
</script>

<template>
  <!-- 技能 -->
  <div v-if="allSkillTypes.length > 0">
    <div class="section-title section-collapsible" @click="skillsCollapsed = !skillsCollapsed">
      {{ t('skillSection') }}
      <span class="collapse-arrow">{{ skillsCollapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!skillsCollapsed">
      <SkillGroup
        v-for="skillType in allSkillTypes"
        :key="skillType.type"
        :skill-type="skillType"
        :active-char="activeChar"
        :card-state="cardState"
        :range-group="rangeGroup"
      />
    </div>
  </div>

  <!-- 能力 -->
  <div class="section-title section-collapsible" @click="abilitiesCollapsed = !abilitiesCollapsed">
    {{ t('abilityTitle') }}
    <span class="collapse-arrow">{{ abilitiesCollapsed ? '▶' : '▼' }}</span>
  </div>
  <div v-show="!abilitiesCollapsed">
    <template v-if="abilities.length > 0 || supportIds.length > 0">
      <div v-for="a in abilities" :key="a.id">
        <div class="banner-title">{{ a.name || `ID:${a.id}` }}</div>
        <div class="content-block">
          <AbilityCard :ability="a" />
        </div>
      </div>
      <SupportAbilitySection
        v-if="supportIds.length > 0"
        :support-ids="supportIds"
        :ability-map="abilityMap"
        :max-rarity="activeChar.max_rarity || 8"
        :initial-rarity="activeChar.initial_rarity || 1"
      />
    </template>
    <div v-else class="no-data">{{ t('none') }}</div>
  </div>

  <!-- 调和 -->
  <SynthesisModule :character-data="characterData" />
</template>
