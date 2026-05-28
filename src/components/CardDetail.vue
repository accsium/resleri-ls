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

const toggleActive = computed(() => props.cardState.toggleActive)
const activeChar = computed(() => {
  if (toggleActive.value && props.characterData.switch_stat) {
    return { ...props.characterData, ...props.characterData.switch_stat }
  }
  return props.characterData
})

const skills = computed(() => activeChar.value._skills || [])

const allSkillTypes = computed(() => {
  const types = []
  const char = activeChar.value

  if (char.leader_skill) {
    types.push({ type: 'leader', name: t('leaderSkillSection'), levels: [char.leader_skill] })
  }

  const activeLevels = []
  skills.value.forEach(group => {
    if (group.type.startsWith('active')) {
      if (group.skills?.length > 0) activeLevels.push(...group.skills)
    }
  })
  if (activeLevels.length > 0) {
    types.push({ type: 'active', name: t('skillType').active, levels: activeLevels })
  }

  const typeText = t('skillType')
  skills.value.forEach(group => {
    if (group.type === 'normal1' || group.type === 'normal2' || group.type === 'burst') {
      if (group.skills && group.skills.length > 0) {
        types.push({ type: group.type, name: typeText[group.type] || group.type, levels: group.skills })
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

const abilityIds = computed(() => activeChar.value.ability_ids || [])

const abilities = computed(() => abilityIds.value.map(id => abilityMap.value[id]).filter(Boolean))

const supportIds = computed(() => activeChar.value.support_ability_ids || [])

const skillsCollapsed = ref(false)
const abilitiesCollapsed = ref(false)
</script>

<template>
  <template v-if="allSkillTypes.length > 0">
    <div class="section-title section-collapsible" @click="skillsCollapsed = !skillsCollapsed">
      {{ t('skillSection') }}
      <span class="collapse-arrow">{{ skillsCollapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!skillsCollapsed">
      <SkillGroup
        v-for="skillType in allSkillTypes"
        :key="skillType.type"
        :skill-type="skillType"
      />
    </div>
  </template>

  <div class="section-title section-collapsible" @click="abilitiesCollapsed = !abilitiesCollapsed">
    {{ t('abilityTitle') }}
    <span class="collapse-arrow">{{ abilitiesCollapsed ? '▶' : '▼' }}</span>
  </div>
  <div v-show="!abilitiesCollapsed">
    <template v-if="abilities.length > 0">
      <div v-for="a in abilities" :key="a.id">
        <div class="banner-title">{{ a.name || `ID:${a.id}` }}</div>
        <div class="content-block">
          <AbilityCard :ability="a" />
        </div>
      </div>
    </template>
    <SupportAbilitySection
      v-if="supportIds.length > 0"
      :support-ids="supportIds"
      :ability-map="abilityMap"
      :max-rarity="activeChar.max_rarity || 8"
      :initial-rarity="activeChar.initial_rarity || 1"
    />
    <div v-if="abilities.length === 0 && supportIds.length === 0" class="no-data">{{ t('none') }}</div>
  </div>

  <SynthesisModule :character-data="characterData" />
</template>
