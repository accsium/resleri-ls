<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import SkillGroup from './SkillGroup.vue'
import AbilityCard from './AbilityCard.vue'
import SupportAbilitySection from './SupportAbilitySection.vue'
import SynthesisModule from './SynthesisModule.vue'
import IconDisplay from './IconDisplay.vue'
import { pickSkillIds } from '../utils/skill'

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

const { t, getField, currentLang } = useI18n()
const { attrMap: attrData } = useCharacterData()
const attrMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(attrData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const typeText = computed(() => t('skillType'))
const { skillsMap, abilitiesMap, loadSkills, loadAbilities } = useCharacterData()

const toggleActive = computed(() => props.cardState.toggleActive)

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
      image_S: st.image_S ?? base.image_S,
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
    types.push({ type: 'ex', name: typeText.ex || 'EX', levels: exSkills })
  }

  return types
})

const activeSkills = computed(() => {
  const char = activeChar.value
  const alt = isAlt.value
  const ids = []
  for (const type of ['active1', 'active2', 'active3']) {
    ids.push(...pickSkillIds(char, type, alt))
  }
  return ids.map(id => skillsMap.value[id]).filter(Boolean)
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
  <div v-if="!detailReady" class="loading">{{ t('loading') }}</div>
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
      <template v-if="activeSkills.length > 0">
        <div class="subsection-title">{{ typeText.active }}</div>
        <div v-for="skill in activeSkills" :key="skill.id" class="skill-group" data-group="active">
          <div class="banner-title">
            <span style="display:inline-flex;align-items:center;gap:3px;height:1em;overflow:visible;">
              <IconDisplay v-for="aid in (skill.attack_attributes || [])" :key="aid" type="attribute" :id="aid" :scale="1" :size="0" />
              <span>{{ skill.name || '??' }} <small v-if="skill.id">(ID:{{ skill.id }})</small></span>
            </span>
          </div>
          <div class="content-block">
            <div class="skill-desc" v-html="skill.description || ''"></div>
            <div class="skill-stats">
              <span class="skill-stat">{{ t('target') }}: {{ getField(skill, 'target_name') || skill.skill_target_type || '?' }}</span>
              <span v-if="skill.attack_attributes?.length" class="skill-stat">{{ t('attribute') }}: {{ skill.attack_attributes.map(a => attrMap[a] || a).join('/') }}</span>
              <span class="skill-stat">{{ t('dmgPower') }}: {{ [1,2,3,4].includes(skill.skill_power_type) && skill.power ? skill.power : '—' }}{{ [1,2,3,4].includes(skill.skill_power_type) && skill.power ? '%' : '' }}</span>
              <span class="skill-stat">{{ t('breakPower') }}: {{ skill.break_power || '—' }}{{ skill.break_power ? '%' : '' }}</span>
              <span class="skill-stat">{{ t('healPower') }}: {{ [5,6,7].includes(skill.skill_power_type) && skill.power ? skill.power : '—' }}{{ [5,6,7].includes(skill.skill_power_type) && skill.power ? '%' : '' }}</span>
              <span class="skill-stat">{{ t('wt') }}: {{ skill.wt ?? 0 }}</span>
              <span class="skill-stat">{{ t('limit') }}: {{ skill.limit_count ?? '—' }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </template>

  <div class="section-title section-collapsible" @click="abilitiesCollapsed = !abilitiesCollapsed">
    {{ t('abilityTitle') }}
    <span class="collapse-arrow">{{ abilitiesCollapsed ? '▶' : '▼' }}</span>
  </div>
  <div v-show="!abilitiesCollapsed">
    <template v-if="abilities.length > 0">
      <div class="subsection-title">{{ t('characterAbility') }}</div>
      <div v-for="a in abilities" :key="a.id || a.name">
        <div class="banner-title">{{ a.name || `ID:${a.id}` }}</div>
        <div class="content-block">
          <AbilityCard :ability="a" />
        </div>
      </div>
    </template>
    <template v-for="ba in boardAbilities" :key="ba.key">
      <template v-if="boardActiveLevel(ba)">
        <div class="subsection-title">{{ t('boardAbility') }}</div>
        <div class="banner-title">
          <span>{{ boardActiveLevel(ba).name || t('boardAbility') }}</span>
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
