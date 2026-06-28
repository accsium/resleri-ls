<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import SkillGroup from './SkillGroup.vue'
import AbilityCard from './AbilityCard.vue'
import SupportAbilitySection from './SupportAbilitySection.vue'
import SynthesisModule from './SynthesisModule.vue'

const props = defineProps({
  characterData: Object,
  cardState: Object,
  characterId: Number,
})

const detailReady = ref(false)

onMounted(() => {
  Promise.all([loadSkills(), loadAbilities()]).finally(() => {
    detailReady.value = true
  })
})

const { t } = useI18n()
const { skillsMap, abilitiesMap, loadSkills, loadAbilities } = useCharacterData()

const toggleActive = computed(() => props.cardState.toggleActive)

// 根据切换类型获取技能 ID 数组（pre 或 post）
function pickSkillIds(char, type, useAlt) {
  const group = char.skills?.[type]
  if (!group) return []
  if (useAlt && char.switch === 'evolve') return group.post || []
  return group.pre || []
}

const activeChar = computed(() => {
  const base = props.characterData
  const useSwitch = base.switch === 'change'
    ? !toggleActive.value
    : toggleActive.value

  if (!useSwitch || !base.switch_stat) return base

  if (base.switch === 'change') {
    const st = base.switch_stat
    return {
      ...base,
      skills: st.skills || base.skills,
      abilities: st.abilities || base.abilities,
      leader_skill: st.leader_skill || base.leader_skill,
    }
  }
  // evolve
  return base
})

const isAlt = computed(() => {
  const base = props.characterData
  const useSwitch = base.switch === 'change'
    ? !toggleActive.value
    : toggleActive.value
  return useSwitch && !!base.switch_stat
})

const allSkillTypes = computed(() => {
  const types = []
  const char = activeChar.value
  const alt = isAlt.value

  if (char.leader_skill) {
    types.push({ type: 'leader', name: t('leaderSkillSection'), levels: [char.leader_skill] })
  }

  const normalTypes = ['normal1', 'normal2', 'burst']
  const typeText = t('skillType')
  normalTypes.forEach(type => {
    const ids = pickSkillIds(char, type, alt)
    const skills = ids.map(id => skillsMap.value[id]).filter(Boolean)
    if (skills.length > 0) {
      types.push({ type, name: typeText[type] || type, levels: skills })
    }
  })

  const exIds = char.skills?.ex || []
  const exSkills = exIds.map(id => skillsMap.value[id]).filter(Boolean)
  if (exSkills.length > 0) {
    types.push({ type: 'extra', name: typeText.extra || 'EX', levels: exSkills })
  }

  return types
})

const abi = computed(() => {
  const char = activeChar.value
  const alt = isAlt.value && char.switch === 'evolve'
  if (alt && char.switch_stat?.abilities) return char.switch_stat.abilities
  return char.abilities || {}
})

const abilities = computed(() =>
  (abi.value.character || []).map(id => abilitiesMap.value[id]).filter(Boolean)
)

const supportIds = computed(() => abi.value.support || [])

const boardAbilities = computed(() => {
  const result = []
  ;['board1', 'board2', 'board3'].forEach(key => {
    const ids = abi.value[key]
    if (ids && ids.length > 0) {
      result.push({ key, levels: ids.map(id => abilitiesMap.value[id]).filter(Boolean) })
    }
  })
  return result
})

const boardActiveIndex = ref({})

watch(boardAbilities, (baList) => {
  const next = { ...boardActiveIndex.value }
  baList.forEach(ba => {
    if (next[ba.key] == null || next[ba.key] >= ba.levels.length) {
      next[ba.key] = ba.levels.length - 1
    }
  })
  boardActiveIndex.value = next
}, { immediate: true })

function boardActiveLevel(ba) {
  return ba.levels[boardActiveIndex.value[ba.key]] || null
}

const skillsCollapsed = ref(false)
const abilitiesCollapsed = ref(false)
</script>

<template>
  <div v-if="!detailReady" class="loading">加载中...</div>
  <template v-else>
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
      <div class="subsection-title">角色能力</div>
      <div v-for="a in abilities" :key="a.id || a.name">
        <div class="banner-title">{{ a.name || `ID:${a.id}` }}</div>
        <div class="content-block">
          <AbilityCard :ability="a" />
        </div>
      </div>
    </template>
    <template v-for="ba in boardAbilities" :key="ba.key">
      <template v-if="boardActiveLevel(ba)">
        <div class="subsection-title">光玉板能力</div>
        <div class="banner-title">
          <span>{{ boardActiveLevel(ba).name || '光玉板能力' }}</span>
          <div v-if="ba.levels.length > 1" class="level-tabs">
            <button
              v-for="(lv, li) in ba.levels" :key="lv.id || li"
              class="level-tab"
              :class="{ active: boardActiveIndex[ba.key] === li }"
              @click="boardActiveIndex[ba.key] = li"
            >Lv.{{ li + 1 }}</button>
          </div>
        </div>
        <div class="content-block">
          <AbilityCard :ability="boardActiveLevel(ba)" />
        </div>
      </template>
    </template>
    <SupportAbilitySection
      v-if="supportIds.length > 0"
      :support-ids="supportIds"
      :ability-map="abilitiesMap"
      :max-rarity="activeChar.max_rarity || 8"
      :initial-rarity="activeChar.initial_rarity || 1"
    />
    <div v-if="abilities.length === 0 && supportIds.length === 0" class="no-data">{{ t('none') }}</div>
  </div>

  <SynthesisModule :character-data="characterData" />
  </template>
</template>
